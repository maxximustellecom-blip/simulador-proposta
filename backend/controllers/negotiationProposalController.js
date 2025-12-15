import { Negotiation, NegociacaoProposta } from '../models/index.js';

function canAccess(actor, negotiation) {
  if (!actor) return false;
  if (actor.role === 'admin') return true;
  return Number(negotiation.created_by || 0) === Number(actor.id);
}
function toNumber(x, d = 0) {
  const n = Number(x);
  return isFinite(n) ? n : d;
}

export async function getProposalForNegotiation(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const negotiation = await Negotiation.findByPk(id);
    if (!negotiation) return res.status(404).json({ error: 'negociação não encontrada' });
    if (!canAccess(req.user, negotiation)) return res.status(403).json({ error: 'forbidden' });
    const prop = await NegociacaoProposta.findOne({ where: { negotiation_id: id } });
    if (!prop) return res.json(null);
    return res.json({
      negotiation_id: prop.negotiation_id,
      linhas: prop.linhas,
      total_valor: Number(prop.total_valor || 0),
      total_acessos: Number(prop.total_acessos || 0)
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao buscar proposta', details: String(err && err.message ? err.message : err) });
  }
}

export async function saveProposalForNegotiation(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const negotiation = await Negotiation.findByPk(id);
    if (!negotiation) return res.status(404).json({ error: 'negociação não encontrada' });
    if (!canAccess(req.user, negotiation)) return res.status(403).json({ error: 'forbidden' });
    const { linhas } = req.body || {};
    if (!Array.isArray(linhas) || linhas.length === 0) return res.status(400).json({ error: 'linhas inválidas' });
    const total_acessos = linhas.reduce((acc, l) => acc + toNumber(l.quantidade, 0), 0);
    const total_valor = linhas.reduce((acc, l) => {
      const q = toNumber(l.quantidade, 1);
      const vPlano = toNumber(l.valorPlano, 0);
      const vAparelho = String(l.temAparelho) === 'Sim' ? toNumber(l.valorAparelho, 0) : 0;
      return acc + (q * vPlano) + (q * vAparelho);
    }, 0);
    let prop = await NegociacaoProposta.findOne({ where: { negotiation_id: id } });
    if (!prop) {
      prop = await NegociacaoProposta.create({
        negotiation_id: id,
        linhas,
        total_valor,
        total_acessos,
        created_by: req.user ? req.user.id : null
      });
    } else {
      prop.linhas = linhas;
      prop.total_valor = total_valor;
      prop.total_acessos = total_acessos;
      await prop.save();
    }
    negotiation.valor = total_valor;
    await negotiation.save();
    return res.status(200).json({
      negotiation_id: prop.negotiation_id,
      linhas: prop.linhas,
      total_valor: Number(prop.total_valor || 0),
      total_acessos: Number(prop.total_acessos || 0)
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao salvar proposta', details: String(err && err.message ? err.message : err) });
  }
}
