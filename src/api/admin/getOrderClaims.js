// src/api/admin/getOrderClaims.js
import Medusa from "@medusajs/medusa-js";

const medusa = new Medusa({ baseUrl: "http://localhost:9000", maxRetries: 3 });

export const handler = async (req, res) => {
  const { orderId } = req.query;

  try {
    const { order } = await medusa.admin.orders.retrieve(orderId);
    res.status(200).json({ order_id: order.id });
  } catch (error) {
    console.error("Error retrieving order claims:", error);
    res.status(500).json({ error: "Failed to retrieve order claims" });
  }
};
