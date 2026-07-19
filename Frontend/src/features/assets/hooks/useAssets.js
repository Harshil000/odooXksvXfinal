import { useEffect, useState } from "react";
import { createAssetsForProduct, createMissingAssetsForProduct, loadAssetInventory } from "../services/assets.service";
import { mapProductWithAssets } from "../utils/asset.mapper";
import { normalizeAssetCode } from "../utils/qr.util";

export function useAssets() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingProductId, setCreatingProductId] = useState("");
  const [error, setError] = useState(null);
  const [scanQuery, setScanQuery] = useState("");

  const refreshAssets = async () => {
    const rows = await loadAssetInventory();
    setProducts(rows);
  };

  useEffect(() => {
    let active = true;

    async function fetchAssets() {
      try {
        const rows = await loadAssetInventory();
        if (active) {
          setProducts(rows);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err);
          console.error("Error loading assets:", err);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchAssets();

    return () => {
      active = false;
    };
  }, []);

  const createMissingAssets = async (product) => {
    try {
      setCreatingProductId(product.id);
      const created = await createMissingAssetsForProduct(product);
      setProducts((current) => current.map((item) => {
        if (item.id !== product.id) return item;
        return mapProductWithAssets(
          {
            p_id: item.id,
            pname: item.name,
            quantity: item.quantity,
            product_type: item.productType,
          },
          [...item.assets, ...created],
        );
      }));
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error creating assets:", err);
    } finally {
      setCreatingProductId("");
    }
  };

  const createOneAsset = async (product) => {
    try {
      setCreatingProductId(product.id);
      const created = await createAssetsForProduct(product, 1);
      setProducts((current) => current.map((item) => {
        if (item.id !== product.id) return item;
        return mapProductWithAssets(
          {
            p_id: item.id,
            pname: item.name,
            quantity: item.quantity,
            product_type: item.productType,
          },
          [...item.assets, ...created],
        );
      }));
      setError(null);
    } catch (err) {
      setError(err);
      console.error("Error creating asset:", err);
    } finally {
      setCreatingProductId("");
    }
  };

  const query = normalizeAssetCode(scanQuery);
  let matchedAsset = null;

  if (query) {
    for (const product of products) {
      const asset = product.assets.find((item) => (
        (item.normalizedCode || normalizeAssetCode(item.code)) === query ||
        normalizeAssetCode(item.id) === query
      ));
      if (asset) {
        matchedAsset = { product, asset };
        break;
      }
    }
  }

  return {
    products,
    loading,
    error,
    creatingProductId,
    scanQuery,
    setScanQuery,
    matchedAsset,
    createMissingAssets,
    createOneAsset,
    refreshAssets,
  };
}
