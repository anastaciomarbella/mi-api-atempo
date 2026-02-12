app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await db.from('usuarios').select('*').limit(1);

    if (error) {
      return res.status(500).json({ error });
    }

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("TEST ERROR:", err);
    return res.status(500).json({ message: err.message });
  }
});
