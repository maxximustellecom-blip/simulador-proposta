import xlsx from 'xlsx';
import { CustomProduct, CustomCategory, Regiao } from '../models/index.js';

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

export async function listCustomProducts(req, res) {
  try {
    const prods = await CustomProduct.findAll({
      include: [{ model: CustomCategory, as: 'category' }],
      order: [['created_at', 'DESC']]
    });
    return res.json(prods);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar produtos customizados', details: String(err && err.message ? err.message : err) });
  }
}

export async function createCustomProduct(req, res) {
  try {
    const { categoria_id, nome, descricao, preco, regiao } = req.body || {};
    const cid = Number(categoria_id || 0);
    if (!cid || !nome) return res.status(400).json({ error: 'categoria_id e nome são obrigatórios' });
    const cat = await CustomCategory.findByPk(cid);
    if (!cat) return res.status(404).json({ error: 'categoria não encontrada' });
    const prod = await CustomProduct.create({
      categoria_id: cid,
      nome,
      descricao: descricao || null,
      preco: Number(preco || 0),
      regiao: regiao
    });
    const full = await CustomProduct.findByPk(prod.id, { include: [{ model: CustomCategory, as: 'category' }] });
    return res.status(201).json(full);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar produto customizado', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateCustomProduct(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const { categoria_id, nome, descricao, preco, regiao } = req.body || {};
    const prod = await CustomProduct.findByPk(id);
    if (!prod) return res.status(404).json({ error: 'produto não encontrado' });
    if (categoria_id) {
      const cid = Number(categoria_id || 0);
      const cat = await CustomCategory.findByPk(cid);
      if (!cat) return res.status(404).json({ error: 'categoria não encontrada' });
      prod.categoria_id = cid;
    }
    if (nome) prod.nome = nome;
    if (descricao !== undefined) prod.descricao = descricao || null;
    if (preco !== undefined) prod.preco = Number(preco || 0);
    if (regiao !== undefined) prod.regiao = regiao || null;
    await prod.save();
    const full = await CustomProduct.findByPk(prod.id, { include: [{ model: CustomCategory, as: 'category' }] });
    return res.json(full);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar produto customizado', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteCustomProduct(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const prod = await CustomProduct.findByPk(id);
    if (!prod) return res.status(404).json({ error: 'produto não encontrado' });
    await prod.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir produto customizado', details: String(err && err.message ? err.message : err) });
  }
}

export async function exportCustomProducts(req, res) {
  try {
    const [prods, regioes] = await Promise.all([
      CustomProduct.findAll({
        include: [{ model: CustomCategory, as: 'category' }],
        order: [['created_at', 'DESC']]
      }),
      Regiao.findAll()
    ]);

    const regiaoMap = {};
    regioes.forEach(r => {
      let items = r.items || [];
      if (!Array.isArray(items)) {
        try {
          items = JSON.parse(items);
        } catch {
          items = [];
        }
      }
      const values = items
        .map(i => (i && i.v !== undefined && i.v !== null ? String(i.v) : ''))
        .filter(v => v !== '')
        .join(',');
      if (values) {
        regiaoMap[values] = { id: r.id, nome: r.nome || r.name || '' };
      }
    });

    let csv = 'id,categoria_id,categoria_nome,categoria_tipo,nome,descricao,preco,regiao_id,regiao_nome,regiao_valor,created_at,updated_at\n';
    prods.forEach(p => {
      const categoriaNome = p.category && (p.category.nome || p.category.name) ? (p.category.nome || p.category.name) : '';
      const categoriaTipo = p.category && p.category.tipo ? p.category.tipo : '';
      const regiaoValor = p.regiao || '';
      const regiaoObj = regiaoMap[regiaoValor] || {};
      const regiaoId = regiaoObj.id || '';
      const regiaoNome = regiaoObj.nome || '';
      
      const createdAt = p.created_at || p.createdAt || '';
      const updatedAt = p.updated_at || p.updatedAt || '';
      const fields = [
        p.id,
        p.categoria_id,
        categoriaNome,
        categoriaTipo,
        p.nome,
        p.descricao || '',
        p.preco,
        regiaoId,
        regiaoNome,
        regiaoValor,
        createdAt,
        updatedAt
      ];
      const row = fields.map(f => {
        const v = f === null || f === undefined ? '' : String(f);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(',');
      csv += row + '\n';
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="produtos-customizados.csv"');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao exportar produtos customizados', details: String(err && err.message ? err.message : err) });
  }
}

export async function importCustomProducts(req, res) {
  try {
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
    const mapping = [];
    headers.forEach((h, index) => {
      const norm = normalizeHeaderName(h);
      let key = null;
      if (norm === 'id') key = 'id';
      else if (norm === 'categoria_id' || norm === 'id_categoria') key = 'categoria_id';
      else if (norm === 'categoria_nome' || norm === 'nome_categoria') key = 'categoria_nome';
      else if (norm === 'tipo' || norm === 'categoria_tipo' || norm === 'tipo_categoria') key = 'tipo';
      else if (norm === 'nome' || norm.includes('produto') || norm.includes('oferta')) key = 'nome';
      else if (norm.includes('descricao') || norm.includes('descri')) key = 'descricao';
      else if ((norm.includes('regiao') && !norm.includes('nome') && !norm.includes('id')) || norm.includes('ddd')) key = 'regiao_valor';
      else if (norm === 'regiao_id' || norm === 'id_regiao') key = 'regiao_id';
      else if (norm === 'regiao_nome' || norm === 'nome_regiao') key = 'regiao_nome';
      else if (norm.includes('preco') || norm.includes('preço') || norm === 'valor') key = 'preco';
      if (key) mapping.push({ index, header: h, key });
    });
    if (!mapping.length) {
      return res.status(400).json({ error: 'nenhuma coluna reconhecida na planilha' });
    }
    let updated = 0;
    let created = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values = {};
      mapping.forEach(({ index, key }) => {
        const raw = row[index];
        if (raw !== undefined && raw !== null) {
          values[key] = String(raw).trim();
        }
      });
      const hasAny = Object.values(values).some(v => String(v || '').trim().length > 0);
      if (!hasAny) {
        continue;
      }
      const lineNumber = i + 2;
      const idRaw = values.id || '';
      const id = idRaw ? Number(String(idRaw).replace(/\D/g, '')) : 0;
      const nome = values.nome || '';
      const descricao = values.descricao || null;
      
      const regiaoValor = values.regiao_valor || values.regiao || null;
      const regiaoIdRaw = values.regiao_id || '';
      const regiaoNome = values.regiao_nome || '';
      
      let finalRegiao = regiaoValor;
      if (regiaoIdRaw) {
        const rid = Number(String(regiaoIdRaw).replace(/\D/g, ''));
        if (rid) {
          const r = await Regiao.findByPk(rid);
          if (r) {
            let items = r.items || [];
            if (!Array.isArray(items)) { try { items = JSON.parse(items); } catch {} }
            finalRegiao = items.map(i => i.v).join(',');
          }
        }
      } else if (regiaoNome) {
        const r = await Regiao.findOne({ where: { nome: regiaoNome } });
        if (r) {
          let items = r.items || [];
          if (!Array.isArray(items)) { try { items = JSON.parse(items); } catch {} }
          finalRegiao = items.map(i => i.v).join(',');
        }
      }

      const regiao = finalRegiao;
      const precoRaw = values.preco || '';
      let preco = null;
      if (precoRaw) {
        let s = String(precoRaw).trim().replace(/\s/g, '');
        const commaIndex = s.lastIndexOf(',');
        const dotIndex = s.lastIndexOf('.');
        if (commaIndex >= 0 && dotIndex >= 0) {
          if (commaIndex > dotIndex) {
            s = s.replace(/\./g, '');
            s = s.replace(',', '.');
          } else {
            s = s.replace(/,/g, '');
          }
        } else if (commaIndex >= 0) {
          s = s.replace(/\./g, '');
          s = s.replace(',', '.');
        } else if (dotIndex >= 0) {
          const parts = s.split('.');
          if (parts.length > 2) {
            const decimal = parts.pop();
            s = parts.join('') + '.' + decimal;
          }
        }
        const n = Number(s);
        if (!Number.isNaN(n)) {
          preco = n;
        }
      }
      let categoriaId = null;
      const categoriaIdRaw = values.categoria_id || '';
      const categoriaNomeRaw = values.categoria_nome || '';
      const tipoRaw = values.tipo || '';
      if (categoriaIdRaw) {
        const cid = Number(String(categoriaIdRaw).replace(/\D/g, ''));
        if (cid) {
          const cat = await CustomCategory.findByPk(cid);
          if (!cat) {
            return res.status(400).json({ error: 'categoria não encontrada na linha ' + lineNumber });
          }
          categoriaId = cid;
        }
      } else if (categoriaNomeRaw) {
        const where = { nome: categoriaNomeRaw };
        if (tipoRaw) {
          where.tipo = tipoRaw;
        }
        const cat = await CustomCategory.findOne({ where });
        if (!cat) {
          return res.status(400).json({ error: 'categoria não encontrada para "' + categoriaNomeRaw + '" na linha ' + lineNumber });
        }
        categoriaId = cat.id;
      }
      let prod = null;
      if (id) {
        prod = await CustomProduct.findByPk(id);
      }
      if (prod) {
        if (categoriaId !== null) {
          prod.categoria_id = categoriaId;
        }
        if (nome) {
          prod.nome = nome;
        }
        if (descricao !== null) {
          prod.descricao = descricao || null;
        }
        if (preco !== null) {
          prod.preco = preco;
        }
        if (regiao !== null) {
          prod.regiao = regiao || null;
        }
        await prod.save();
        updated++;
      } else {
        if (!nome) {
          return res.status(400).json({ error: 'nome é obrigatório na linha ' + lineNumber });
        }
        if (!categoriaId) {
          return res.status(400).json({ error: 'categoria é obrigatória na linha ' + lineNumber });
        }
        const prodCreated = await CustomProduct.create({
          categoria_id: categoriaId,
          nome,
          descricao: descricao || null,
          preco: preco !== null ? preco : 0,
          regiao: regiao || null
        });
        if (prodCreated && prodCreated.id) {
          created++;
        }
      }
    }
    return res.json({ ok: true, updated, created, total: updated + created });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao importar produtos customizados', details: String(err && err.message ? err.message : err) });
  }
}
