import { useEffect, useState } from "react";
import { loadProductDetails } from "../services/product.service";
import { loadProductRentPlans } from "../../rentPlans/services/rentPlan.service";

export function useProductDetails(productId) {
  const [product, setProduct] = useState(null);
  const [image, setImage] = useState("");
  const [rentPlans, setRentPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchProductDetails() {
      try {
        const [productDetails, plans] = await Promise.all([
          loadProductDetails(productId),
          loadProductRentPlans(productId),
        ]);

        if (active) {
          setProduct(productDetails.product);
          setImage(productDetails.image);
          setRentPlans(plans);
          setSelectedPlanId(plans[0]?.r_id || "");
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    }

    fetchProductDetails();

    return () => {
      active = false;
    };
  }, [productId]);

  return { product, image, rentPlans, selectedPlanId, setSelectedPlanId };
}
