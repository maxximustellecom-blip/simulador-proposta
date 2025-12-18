import { NegociacaoPropostaAnexos, NegociacaoPropostaCustomizadaAnexos, Negotiation } from '../models/index.js';

export async function listAttachments(req, res) {
  try {
    const negotiationId = req.params.id;
    const list = await NegociacaoPropostaAnexos.findAll({
      where: { negotiation_id: negotiationId },
      attributes: ['id', 'file_name', 'file_type', 'created_at'] // Don't return blob in list
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar anexos', details: error.message });
  }
}

export async function uploadAttachment(req, res) {
  try {
    const negotiationId = req.params.id;
    let fileName, fileType, buffer;

    if (req.file) {
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
      buffer = req.file.buffer;
    } else {
      const body = req.body;
      fileName = body.fileName;
      fileType = body.fileType;
      const fileData = body.fileData;
      if (fileData) {
        const base64Data = fileData.replace(/^data:(.*,)?/, '');
        buffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!fileName || !buffer) {
      return res.status(400).json({ error: 'Nome do arquivo e dados são obrigatórios' });
    }

    const attachment = await NegociacaoPropostaAnexos.create({
      negotiation_id: negotiationId,
      file_name: fileName,
      file_type: fileType || 'application/octet-stream',
      file_data: buffer
    });

    res.status(201).json({ id: attachment.id, file_name: attachment.file_name });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload', details: error.message });
  }
}

export async function deleteAttachment(req, res) {
  try {
    const { id, attachmentId } = req.params;
    const attachment = await NegociacaoPropostaAnexos.findOne({
      where: { id: attachmentId, negotiation_id: id }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    await attachment.destroy();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir anexo', details: error.message });
  }
}

export async function getAttachmentContent(req, res) {
    try {
        const { id, attachmentId } = req.params;
        const attachment = await NegociacaoPropostaAnexos.findOne({
            where: { id: attachmentId, negotiation_id: id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Anexo não encontrado' });
        }

        res.setHeader('Content-Type', attachment.file_type);
        res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
        res.send(attachment.file_data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao baixar anexo', details: error.message });
    }
}


// Custom Proposal Attachments

export async function listCustomAttachments(req, res) {
  try {
    const negotiationId = req.params.id;
    const list = await NegociacaoPropostaCustomizadaAnexos.findAll({
      where: { negotiation_id: negotiationId },
      attributes: ['id', 'file_name', 'file_type', 'created_at']
    });
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar anexos customizados', details: error.message });
  }
}

export async function uploadCustomAttachment(req, res) {
  try {
    const negotiationId = req.params.id;
    let fileName, fileType, buffer;

    if (req.file) {
      fileName = req.file.originalname;
      fileType = req.file.mimetype;
      buffer = req.file.buffer;
    } else {
      const body = req.body;
      fileName = body.fileName;
      fileType = body.fileType;
      const fileData = body.fileData;
      if (fileData) {
        const base64Data = fileData.replace(/^data:(.*,)?/, '');
        buffer = Buffer.from(base64Data, 'base64');
      }
    }

    if (!fileName || !buffer) {
      return res.status(400).json({ error: 'Nome do arquivo e dados são obrigatórios' });
    }

    const attachment = await NegociacaoPropostaCustomizadaAnexos.create({
      negotiation_id: negotiationId,
      file_name: fileName,
      file_type: fileType || 'application/octet-stream',
      file_data: buffer
    });

    res.status(201).json({ id: attachment.id, file_name: attachment.file_name });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao fazer upload customizado', details: error.message });
  }
}

export async function deleteCustomAttachment(req, res) {
  try {
    const { id, attachmentId } = req.params;
    const attachment = await NegociacaoPropostaCustomizadaAnexos.findOne({
      where: { id: attachmentId, negotiation_id: id }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }

    await attachment.destroy();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao excluir anexo customizado', details: error.message });
  }
}

export async function getCustomAttachmentContent(req, res) {
    try {
        const { id, attachmentId } = req.params;
        const attachment = await NegociacaoPropostaCustomizadaAnexos.findOne({
            where: { id: attachmentId, negotiation_id: id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Anexo não encontrado' });
        }

        res.setHeader('Content-Type', attachment.file_type);
        res.setHeader('Content-Disposition', `inline; filename="${attachment.file_name}"`);
        res.send(attachment.file_data);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao baixar anexo customizado', details: error.message });
    }
}
