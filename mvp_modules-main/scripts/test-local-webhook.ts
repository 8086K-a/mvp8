/**
 * 本地测试 PayPal Webhook
 * 使用方法: npx tsx scripts/test-local-webhook.ts
 */

const WEBHOOK_URL = "http://localhost:3000/api/payment/webhook/paypal";

// 模拟 PayPal Webhook 数据
const mockWebhookData = {
  id: "WH-TEST-" + Date.now(),
  event_version: "1.0",
  create_time: new Date().toISOString(),
  resource_type: "capture",
  event_type: "PAYMENT.CAPTURE.COMPLETED", // 支付完成事件
  summary: "Payment completed for test",
  resource: {
    id: "CAPTURE-" + Date.now(),
    status: "COMPLETED",
    amount: {
      value: "9.99",
      currency_code: "USD",
    },
    custom_id: "你的用户ID", // ⚠️ 替换为实际的用户ID
    supplementary_data: {
      related_ids: {
        order_id: "ORDER-" + Date.now(),
      },
    },
  },
  _paypal_transmission_id: "TEST-TRANSMISSION-" + Date.now(), // 防止重复处理
};

async function testWebhook() {
  console.log("🧪 测试 PayPal Webhook...");
  console.log("📤 发送数据:", JSON.stringify(mockWebhookData, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "paypal-transmission-sig": "test-signature",
        "paypal-cert-url": "https://api.sandbox.paypal.com/cert",
        "paypal-transmission-id": mockWebhookData._paypal_transmission_id,
        "paypal-transmission-time": new Date().toISOString(),
        "paypal-auth-algo": "SHA256withRSA",
      },
      body: JSON.stringify(mockWebhookData),
    });

    const result = await response.json();
    console.log("✅ Webhook 响应:", result);

    if (response.ok) {
      console.log("🎉 测试成功！请检查数据库中的 subscriptions 表");
    } else {
      console.error("❌ 测试失败:", result);
    }
  } catch (error) {
    console.error("❌ 请求失败:", error);
  }
}

testWebhook();
