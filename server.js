import express from "express";
import pkg from "pg";
import cors from "cors";

const { Pool } = pkg;
const app = express();

// ================== MIDDLEWARE ==================
app.use(cors());
app.use(express.json());

console.log("🚀 Backend iniciado");

// ================== DATABASE ==================
// ⚠️ NUNCA coloque a URL do banco hardcoded
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não definida no ambiente");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Teste de conexão
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conectado ao PostgreSQL com sucesso");
    client.release();
  } catch (err) {
    console.error("❌ Erro ao conectar no banco:", err.message);
    process.exit(1);
  }
})();

// ================== ROTAS ==================

// Health check
app.get("/", (req, res) => {
  res.send("API funcionando corretamente");
});

// -------- LISTAR USUÁRIOS (ADMIN) --------
app.get("/api/users", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, email, plan, created_at FROM users ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Erro ao listar usuários:", err.message);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// -------- CRIAR USUÁRIO (SITE / APP) --------
app.post("/api/users", async (req, res) => {
  const { name, email, plan } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      error: "Nome e email são obrigatórios",
    });
  }

  try {
    const { rows } = await pool.query(
      `
      INSERT INTO users (name, email, plan)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, plan, created_at
      `,
      [name, email, plan || "free"]
    );

    console.log("👤 Novo usuário criado:", rows[0]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Erro ao criar usuário:", err.message);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// ================== SERVER ==================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});
