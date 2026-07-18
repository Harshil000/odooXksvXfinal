import {
  createAttributeKey,
  createAttributeValue,
  createCompanyAttribute,
  getCompanyAttributes,
  linkAttributeToProduct,
} from "../api/attribute.api";

export async function loadCompanyAttributes(companyId) {
  const data = await getCompanyAttributes(companyId);
  return data.attributes || [];
}

export async function saveProductAttributes({ companyId, productId, attributes, companyAttributes }) {
  const savedAttributes = [...companyAttributes];

  for (const attribute of attributes) {
    if (!attribute.name.trim() || !attribute.values.trim()) {
      continue;
    }

    let existingAttribute = savedAttributes.find(
      (item) => item.name.toLowerCase() === attribute.name.toLowerCase(),
    );

    if (!existingAttribute?.attri_id) {
      const data = await createCompanyAttribute(companyId, { name: attribute.name });
      existingAttribute = data.attribute;
      savedAttributes.push(existingAttribute);
    }

    await linkAttributeToProduct(productId, { attri_id: existingAttribute.attri_id });

    const values = attribute.values
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    for (const value of values) {
      const keyData = await createAttributeKey(existingAttribute.attri_id, { key_name: value });
      await createAttributeValue(keyData.key.key_id, { value_name: value });
    }
  }

  return savedAttributes;
}
