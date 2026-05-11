const db = require("../models");
const Task = db.task;
const Op = db.Sequelize.Op;

async function createTasks(req, res) {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      userId: req.userId,
    });

    res.status(201).json({ message: "User created successfully!", task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getAllTasks(req, res) {
  try {
    const allTasks = await Task.findAll();
    res.status(200).json({ tasks: allTasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getTasksByUser(req, res) {
  try {
    const userTasks = await Task.findAll({ where: { userId: req.userId } });
    res.status(200).json({ tasks: userTasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getTaskById(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json({ tasks: task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function updateTask(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.userId !== req.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    await task.update({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
    });

    res.status(200).json({ message: "Task updated successfully", task: task });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function deleteTask(req, res) {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (task.userId !== req.userId) {
      return res.status(403).json({ message: "Not allowed" });
    }
    await task.destroy();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function filterTasks(req, res) {
  try {
    const status = req.query.status;

    const tasks = await Task.findAll({
      where: {
        status: status,
        userId: req.userId,
      },
    });
    res.status(200).json({ tasks: tasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getTasks(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const status = req.query.status;
    const search = req.query.search;

    const offset = (page - 1) * limit;

    const whereCondition = { userId: req.userId };
    if (status) whereCondition.status = status;
    if (search) {
      whereCondition[Op.or] = [
        { [Op.iLike]: `%${search}%` }, 
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: tasks } = await Task.findAndCountAll({
      where: whereCondition,
      limit: limit,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      totalTasks: count,
      totalPages: totalPages,
      currentPage: page,
      tasks: tasks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createTasks,
  getAllTasks,
  getTasksByUser,
  getTaskById,
  updateTask,
  deleteTask,
  filterTasks,
  getTasks,
};
