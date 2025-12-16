import { Negotiation, NegociacaoPropostaCustomizada } from '../models/index.js';

function canAccess(actor, negotiation) {
  if (!actor) return false;
  if (actor.role === 'admin') return true;
  return Number(negotiation.created_by || 0) === Number(actor.id);
}
function toNumber(x, d = 0) {
  const n = Number(x);
  return isFinite(n) ? n : d;
}
function calcularPrecoFinal(l) {
  const v = toNumber(l.valorNaoFidelizado, 0);
  const desc = toNumber(l.desconto, 0);
  const planoFinal = v * (1 - desc / 100);
  const device = String(l.temAparelho || '') === 'Sim' ? toNumber(l.valorAparelho, 0) : 0;
  return planoFinal + device;
}

export async function getCustomProposalForNegotiation(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const negotiation = await Negotiation.findByPk(id);
    if (!negotiation) return res.status(404).json({ error: 'negociação não encontrada' });
    if (!canAccess(req.user, negotiation)) return res.status(403).json({ error: 'forbidden' });
    const prop = await NegociacaoPropostaCustomizada.findOne({ where: { negotiation_id: id } });
    if (!prop) return res.json(null);
    return res.json({
      negotiation_id: prop.negotiation_id,
      linhas: prop.linhas,
      total_atual: Number(prop.total_atual || 0),
      total_proposto: Number(prop.total_proposto || 0),
      total_economia: Number(prop.total_economia || 0),
      percentual_economia: Number(prop.percentual_economia || 0),
      total_acessos: Number(prop.total_acessos || 0)
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao buscar proposta customizada', details: String(err && err.message ? err.message : err) });
  }
}

export async function saveCustomProposalForNegotiation(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const negotiation = await Negotiation.findByPk(id);
    if (!negotiation) return res.status(404).json({ error: 'negociação não encontrada' });
    if (!canAccess(req.user, negotiation)) return res.status(403).json({ error: 'forbidden' });
    const { linhas } = req.body || {};
    if (!Array.isArray(linhas) || linhas.length === 0) return res.status(400).json({ error: 'linhas inválidas' });
    const total_atual = linhas.reduce((acc, l) => acc + toNumber(l.precoAtual, 0), 0);
    const total_proposto = linhas.reduce((acc, l) => acc + calcularPrecoFinal(l), 0);
    const total_economia = total_atual - total_proposto;
    const percentual_economia = total_atual > 0 ? (total_economia / total_atual) * 100 : 0;
    const total_acessos = linhas.length;
    let prop = await NegociacaoPropostaCustomizada.findOne({ where: { negotiation_id: id } });
    if (!prop) {
      prop = await NegociacaoPropostaCustomizada.create({
        negotiation_id: id,
        linhas,
        total_atual,
        total_proposto,
        total_economia,
        percentual_economia,
        total_acessos,
        created_by: req.user ? req.user.id : null
      });
    } else {
      prop.linhas = linhas;
      prop.total_atual = total_atual;
      prop.total_proposto = total_proposto;
      prop.total_economia = total_economia;
      prop.percentual_economia = percentual_economia;
      prop.total_acessos = total_acessos;
      await prop.save();
    }
    negotiation.valor = total_proposto;
    await negotiation.save();
    return res.status(200).json({
      negotiation_id: prop.negotiation_id,
      linhas: prop.linhas,
      total_atual: Number(prop.total_atual || 0),
      total_proposto: Number(prop.total_proposto || 0),
      total_economia: Number(prop.total_economia || 0),
      percentual_economia: Number(prop.percentual_economia || 0),
      total_acessos: Number(prop.total_acessos || 0)
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao salvar proposta customizada', details: String(err && err.message ? err.message : err) });
  }
}
