import ApiKeyGeneratorClient from "./ApiKeyGeneratorClient";

export const metadata = {
  title: "API Key Generator: Free Secure Random Keys",
  description:
    "Free API key generator. Create secure random API keys in hex, base64, alphanumeric or UUID-style formats, with an optional prefix, right in your browser.",
  alternates: { canonical: "/api-key-generator" },
};

export default function ApiKeyGeneratorPage() {
  return <ApiKeyGeneratorClient />;
}
