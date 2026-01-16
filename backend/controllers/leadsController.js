import { LeadBatch, Lead, User } from '../models/index.js';
import xlsx from 'xlsx';

function normalizeHeaderName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function parseCsv(content) {
  const text = String(content || '');
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (!lines.length) return { headers: [], rows: [] };
  const rows = [];
  let current = [];
  let value = '';
  let inQuotes = false;
  function pushValue() {
    current.push(value);
    value = '';
  }
  function pushRow() {
    if (current.length > 0) {
      rows.push(current);
      current = [];
    }
  }
  const chars = Array.from(text);
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === '"') {
      if (inQuotes && chars[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      pushValue();
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && chars[i + 1] === '\n') {
        i++;
      }
      pushValue();
      pushRow();
    } else {
      value += ch;
    }
  }
  if (value.length > 0 || current.length > 0) {
    pushValue();
    pushRow();
  }
  if (!rows.length) return { headers: [], rows: [] };
  const headers = rows[0].map(h => String(h || '').trim());
  const dataRows = rows.slice(1).filter(r => r.some(v => String(v || '').trim().length > 0));
  return { headers, rows: dataRows };
}

function buildFieldMapping(headers) {
  const mapping = [];
  headers.forEach((h, index) => {
    const norm = normalizeHeaderName(h);
    let key = null;
    if (norm.includes('cnpj')) key = 'cnpj';
    else if (norm.includes('email')) key = 'email';
    else if (
      norm.includes('contato') ||
      norm.includes('responsavel') ||
      norm.includes('responsável') ||
      norm === 'tel' ||
      norm.includes('telefone')
    ) key = 'contato';
    else if (norm.includes('endereco') || norm.includes('endereço') || norm.includes('logradouro') || norm.includes('rua')) key = 'endereco';
    mapping.push({ index, header: h, key });
  });
  return mapping;
}

export async function importLeads(req, res) {
  try {
    const actor = req.user;
    if (!actor || !actor.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const isAdmin = actor.role === 'admin';
    let assignedUserId = null;
    const body = req.body || {};
    const rawAssign = body.assignedUserId || body.assigned_to || body.userId;
    if (isAdmin && rawAssign) {
      assignedUserId = Number(rawAssign);
      if (!assignedUserId || Number.isNaN(assignedUserId)) {
        return res.status(400).json({ error: 'assignedUserId inválido' });
      }
    } else {
      assignedUserId = Number(actor.id);
    }
    const assignedUser = await User.findByPk(assignedUserId);
    if (!assignedUser || assignedUser.role !== 'user') {
      return res.status(400).json({ error: 'usuário atribuído inválido' });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'arquivo obrigatório' });
    }
    const originalName = String(req.file.originalname || '').toLowerCase();
    const ext = originalName.split('.').pop() || '';
    let headers = [];
    let rows = [];
    if (ext === 'xls' || ext === 'xlsx') {
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames && workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ error: 'planilha vazia ou inválida' });
      }
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!Array.isArray(data) || !data.length) {
        return res.status(400).json({ error: 'planilha vazia ou inválida' });
      }
      headers = data[0].map(h => String(h || '').trim());
      rows = data.slice(1).filter(r => Array.isArray(r) && r.some(v => String(v || '').trim().length > 0));
    } else {
      const parsed = parseCsv(req.file.buffer.toString('utf8'));
      headers = parsed.headers;
      rows = parsed.rows;
    }
    if (!headers.length || !rows.length) {
      return res.status(400).json({ error: 'planilha vazia ou inválida' });
    }
    const mapping = buildFieldMapping(headers);
    const leadsPayload = [];
    for (const row of rows) {
      const payload = {};
      let cnpj = null;
      let email = null;
      let contato = null;
      let endereco = null;
      mapping.forEach(({ index, header, key }) => {
        const value = String(row[index] || '').trim();
        payload[header] = value;
        if (!value) return;
        if (key === 'cnpj') cnpj = value;
        else if (key === 'email') email = value;
        else if (key === 'contato') contato = value;
        else if (key === 'endereco') endereco = value;
      });
      if (!Object.values(payload).some(v => String(v || '').trim().length > 0)) {
        continue;
      }
      const normalized = {};
      Object.keys(payload).forEach(h => {
        const norm = normalizeHeaderName(h);
        normalized[norm] = payload[h];
      });
      if (!cnpj && normalized.doc) {
        cnpj = normalized.doc;
      }
      
      // Prioridade para composição DDD + TEL do payload
      const normDdd = normalized.ddd || '';
      const normTel = normalized.tel || '';
      if (normTel) {
        const parts = [];
        if (normDdd) parts.push('(' + normDdd + ')');
        parts.push(normTel);
        contato = parts.join(' ');
      }

      if (!endereco) {
        const tpLog = normalized.tp_log || '';
        const lograd = normalized.lograd || '';
        const numero = normalized.numero || '';
        const complem = normalized.complem || '';
        const bairro = normalized.bairro || '';
        const cidade = normalized.cidade || '';
        const uf = normalized.uf || '';
        const cep = normalized.cep || '';
        const parts = [];
        const line1Parts = [];
        const logPrefix = (tpLog ? tpLog + ' ' : '') + lograd;
        if (logPrefix.trim()) line1Parts.push(logPrefix.trim());
        if (numero) line1Parts.push('nº ' + numero);
        if (complem) line1Parts.push(complem);
        if (line1Parts.length) parts.push(line1Parts.join(', '));
        const line2Parts = [];
        if (bairro) line2Parts.push(bairro);
        if (cidade || uf) line2Parts.push([cidade, uf].filter(Boolean).join(' - '));
        if (cep) line2Parts.push('CEP ' + cep);
        if (line2Parts.length) parts.push(line2Parts.join(' • '));
        const built = parts.join(' | ');
        if (built) endereco = built;
      }
      leadsPayload.push({ cnpj, email, contato, endereco, payload });
    }
    if (!leadsPayload.length) {
      return res.status(400).json({ error: 'nenhum lead válido encontrado' });
    }
    const batch = await LeadBatch.create({
      file_name: req.file.originalname || 'import.csv',
      assigned_to: assignedUserId,
      created_by: actor.id,
      total_leads: leadsPayload.length
    });
    const records = leadsPayload.map(l => ({
      batch_id: batch.id,
      cnpj: l.cnpj,
      email: l.email,
      contato: l.contato,
      endereco: l.endereco,
      payload: l.payload
    }));
    await Lead.bulkCreate(records);
    return res.status(201).json({
      id: batch.id,
      file_name: batch.file_name,
      assigned_to: batch.assigned_to,
      created_by: batch.created_by,
      total_leads: batch.total_leads
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao importar leads', details: String(err && err.message ? err.message : err) });
  }
}

export async function listBatches(req, res) {
  try {
    const actor = req.user;
    if (!actor || !actor.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const isAdmin = actor.role === 'admin';
    const where = {};
    if (!isAdmin) {
      where.assigned_to = Number(actor.id);
    }
    const batches = await LeadBatch.findAll({
      where,
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    const result = batches.map(b => ({
      id: b.id,
      file_name: b.file_name,
      total_leads: b.total_leads,
      assigned_to: b.assigned_to,
      assigned_user: b.assignedUser ? { id: b.assignedUser.id, name: b.assignedUser.name } : null,
      created_by: b.created_by,
      creator: b.creator ? { id: b.creator.id, name: b.creator.name } : null,
      created_at: b.createdAt
    }));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar remessas de leads', details: String(err && err.message ? err.message : err) });
  }
}

export async function getBatchDetail(req, res) {
  try {
    const actor = req.user;
    if (!actor || !actor.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'missing_id' });
    }
    const batch = await LeadBatch.findByPk(id, {
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name'] },
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: Lead, as: 'leads' }
      ]
    });
    if (!batch) {
      return res.status(404).json({ error: 'remessa não encontrada' });
    }
    const isAdmin = actor.role === 'admin';
    if (!isAdmin && Number(batch.assigned_to || 0) !== Number(actor.id)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return res.json({
      id: batch.id,
      file_name: batch.file_name,
      total_leads: batch.total_leads,
      assigned_to: batch.assigned_to,
      assigned_user: batch.assignedUser ? { id: batch.assignedUser.id, name: batch.assignedUser.name } : null,
      created_by: batch.created_by,
      creator: batch.creator ? { id: batch.creator.id, name: batch.creator.name } : null,
      created_at: batch.createdAt,
      leads: (batch.leads || []).map(l => {
        let contato = l.contato;
        // Tenta enriquecer a exibição usando payload se tiver DDD e TEL
        if (l.payload && typeof l.payload === 'object') {
          const normalized = {};
          Object.keys(l.payload).forEach(h => {
            const norm = normalizeHeaderName(h);
            normalized[norm] = l.payload[h];
          });
          const ddd = normalized.ddd || '';
          const tel = normalized.tel || '';
          if (tel) {
            const parts = [];
            if (ddd) parts.push('(' + ddd + ')');
            parts.push(tel);
            contato = parts.join(' ');
          }
        }
        return {
          id: l.id,
          cnpj: l.cnpj,
          email: l.email,
          contato,
          endereco: l.endereco,
          payload: l.payload
        };
      })
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao buscar remessa de leads', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteBatch(req, res) {
  try {
    const actor = req.user;
    if (!actor || !actor.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    const id = Number(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'missing_id' });
    }
    const batch = await LeadBatch.findByPk(id);
    if (!batch) {
      return res.status(404).json({ error: 'remessa não encontrada' });
    }
    const isAdmin = actor.role === 'admin';
    // Permitir excluir se for admin ou se for o criador da remessa
    if (!isAdmin && Number(batch.created_by || 0) !== Number(actor.id)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    
    // Deletar leads primeiro (caso cascade não esteja configurado no DB)
    await Lead.destroy({ where: { batch_id: id } });
    await batch.destroy();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir remessa de leads', details: String(err && err.message ? err.message : err) });
  }
}

export async function listAllLeads(req, res) {
  try {
    const actor = req.user;
    if (!actor || !actor.id) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    
    const whereBatch = {};
    if (actor.role !== 'admin') {
      whereBatch.assigned_to = Number(actor.id);
    }
    
    const limit = req.query.limit ? Number(req.query.limit) : 1000;
    const offset = req.query.offset ? Number(req.query.offset) : 0;

    const leads = await Lead.findAll({
      include: [
        { 
          model: LeadBatch, 
          as: 'batch', 
          where: whereBatch,
          attributes: ['id', 'assigned_to', 'created_at']
        }
      ],
      order: [['id', 'DESC']],
      limit,
      offset
    });
    
    const result = leads.map(l => {
        let contato = l.contato;
        if (l.payload && typeof l.payload === 'object') {
          const normalized = {};
          Object.keys(l.payload).forEach(h => {
            const norm = normalizeHeaderName(h);
            normalized[norm] = l.payload[h];
          });
          const ddd = normalized.ddd || '';
          const tel = normalized.tel || '';
          if (tel) {
            const parts = [];
            if (ddd) parts.push('(' + ddd + ')');
            parts.push(tel);
            contato = parts.join(' ');
          }
        }
        
        const payload = l.payload || {};
        let nome = '';
        const possibleNames = ['nome', 'name', 'razao', 'razaosocial', 'razão', 'cliente'];
        for (const key of Object.keys(payload)) {
            const normKey = normalizeHeaderName(key);
            if (possibleNames.includes(normKey)) {
                nome = payload[key];
                break;
            }
        }

        return {
          id: l.id,
          batch_id: l.batch_id,
          cnpj: l.cnpj,
          nome,
          email: l.email,
          contato,
          endereco: l.endereco,
          created_at: l.createdAt
        };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar leads', details: String(err && err.message ? err.message : err) });
  }
}
