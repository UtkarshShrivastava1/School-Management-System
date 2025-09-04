const AcademicSession = require("../models/AcademicSession");

exports.createSession = async (req, res) => {
  try {
    const { name, startDate, endDate, isActive = false } = req.body;
    if (!name || !startDate || !endDate)
      return res
        .status(400)
        .json({ message: "name, startDate, endDate required" });

    if (isActive)
      await AcademicSession.updateMany({}, { $set: { isActive: false } }); // only one active
    const session = await AcademicSession.create({
      name,
      startDate,
      endDate,
      isActive,
    });
    res.status(201).json({ message: "Session created", session });
  } catch (e) {
    if (e.code === 11000)
      return res.status(409).json({ message: "Session name already exists" });
    res.status(500).json({ message: e.message });
  }
};

exports.getActive = async (_req, res) => {
  const s = await AcademicSession.findOne({ isActive: true }).lean();
  if (!s) return res.status(404).json({ message: "No active session" });
  res.json(s);
};

exports.listSessions = async (_req, res) => {
  const items = await AcademicSession.find().sort({ startDate: -1 }).lean();
  res.json({ items });
};
