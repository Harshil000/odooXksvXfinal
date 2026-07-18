import {
  createAttribute,
  getAttributesByCompanyId,
  createProductAttribute,
  updateAttribute,
  deleteAttribute,
  createAttributeKey,
  getAttributeKeysByAttriId,
  updateAttributeKey,
  deleteAttributeKey,
  createAttributeValue,
  getAttributeValuesByKeyId,
  updateAttributeValue,
  deleteAttributeValue,
} from "../repository/attribute.repository.js";

// ==========================================
// ATTRIBUTES
// ==========================================

export async function createAttributeController(req, res, next) {
  try {
    const { c_id } = req.params;
    const { name } = req.body;

    if (!c_id) return res.status(400).json({ message: "Company ID (c_id) is required" });
    if (!name || !name.trim()) return res.status(400).json({ message: "Attribute name is required" });

    const attribute = await createAttribute(c_id, name);
    return res.status(201).json({ message: "Attribute created successfully", attribute });
  } catch (error) {
    next(error);
  }
}

export async function getAttributesController(req, res, next) {
  try {
    const { c_id } = req.params;
    if (!c_id) return res.status(400).json({ message: "Company ID (c_id) is required" });

    const attributes = await getAttributesByCompanyId(c_id);
    return res.status(200).json({ attributes });
  } catch (error) {
    next(error);
  }
}

export async function createProductAttributeController(req, res, next) {
  try {
    const { p_id } = req.params;
    const { attri_id } = req.body;

    if (!p_id || !attri_id) return res.status(400).json({ message: "Product ID and Attribute ID are required" });

    const pa = await createProductAttribute(p_id, attri_id);
    return res.status(201).json({ message: "Product attribute created successfully", product_attribute: pa });
  } catch (error) {
    next(error);
  }
}

export async function updateAttributeController(req, res, next) {
  try {
    const { attri_id } = req.params;
    const { name } = req.body;

    if (!attri_id) return res.status(400).json({ message: "Attribute ID is required" });
    if (!name || !name.trim()) return res.status(400).json({ message: "Attribute name is required" });

    const attribute = await updateAttribute(attri_id, name);
    if (!attribute) return res.status(404).json({ message: "Attribute not found" });

    return res.status(200).json({ message: "Attribute updated successfully", attribute });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttributeController(req, res, next) {
  try {
    const { attri_id } = req.params;
    if (!attri_id) return res.status(400).json({ message: "Attribute ID is required" });

    const deleted = await deleteAttribute(attri_id);
    if (!deleted) return res.status(404).json({ message: "Attribute not found" });

    return res.status(200).json({ message: "Attribute deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// ATTRIBUTE KEYS
// ==========================================

export async function createAttributeKeyController(req, res, next) {
  try {
    const { attri_id } = req.params;
    const { key_name } = req.body;

    if (!attri_id) return res.status(400).json({ message: "Attribute ID is required" });
    if (!key_name || !key_name.trim()) return res.status(400).json({ message: "Key name is required" });

    const key = await createAttributeKey(attri_id, key_name);
    return res.status(201).json({ message: "Attribute key created successfully", key });
  } catch (error) {
    next(error);
  }
}

export async function getAttributeKeysController(req, res, next) {
  try {
    const { attri_id } = req.params;
    if (!attri_id) return res.status(400).json({ message: "Attribute ID is required" });

    const keys = await getAttributeKeysByAttriId(attri_id);
    return res.status(200).json({ keys });
  } catch (error) {
    next(error);
  }
}

export async function updateAttributeKeyController(req, res, next) {
  try {
    const { key_id } = req.params;
    const { key_name } = req.body;

    if (!key_id) return res.status(400).json({ message: "Key ID is required" });
    if (!key_name || !key_name.trim()) return res.status(400).json({ message: "Key name is required" });

    const key = await updateAttributeKey(key_id, key_name);
    if (!key) return res.status(404).json({ message: "Attribute key not found" });

    return res.status(200).json({ message: "Attribute key updated successfully", key });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttributeKeyController(req, res, next) {
  try {
    const { key_id } = req.params;
    if (!key_id) return res.status(400).json({ message: "Key ID is required" });

    const deleted = await deleteAttributeKey(key_id);
    if (!deleted) return res.status(404).json({ message: "Attribute key not found" });

    return res.status(200).json({ message: "Attribute key deleted successfully" });
  } catch (error) {
    next(error);
  }
}

// ==========================================
// ATTRIBUTE VALUES
// ==========================================

export async function createAttributeValueController(req, res, next) {
  try {
    const { key_id } = req.params;
    const { value_name } = req.body;

    if (!key_id) return res.status(400).json({ message: "Key ID is required" });
    if (!value_name || !value_name.trim()) return res.status(400).json({ message: "Value name is required" });

    const value = await createAttributeValue(key_id, value_name);
    return res.status(201).json({ message: "Attribute value created successfully", value });
  } catch (error) {
    next(error);
  }
}

export async function getAttributeValuesController(req, res, next) {
  try {
    const { key_id } = req.params;
    if (!key_id) return res.status(400).json({ message: "Key ID is required" });

    const values = await getAttributeValuesByKeyId(key_id);
    return res.status(200).json({ values });
  } catch (error) {
    next(error);
  }
}

export async function updateAttributeValueController(req, res, next) {
  try {
    const { value_id } = req.params;
    const { value_name } = req.body;

    if (!value_id) return res.status(400).json({ message: "Value ID is required" });
    if (!value_name || !value_name.trim()) return res.status(400).json({ message: "Value name is required" });

    const value = await updateAttributeValue(value_id, value_name);
    if (!value) return res.status(404).json({ message: "Attribute value not found" });

    return res.status(200).json({ message: "Attribute value updated successfully", value });
  } catch (error) {
    next(error);
  }
}

export async function deleteAttributeValueController(req, res, next) {
  try {
    const { value_id } = req.params;
    if (!value_id) return res.status(400).json({ message: "Value ID is required" });

    const deleted = await deleteAttributeValue(value_id);
    if (!deleted) return res.status(404).json({ message: "Attribute value not found" });

    return res.status(200).json({ message: "Attribute value deleted successfully" });
  } catch (error) {
    next(error);
  }
}
