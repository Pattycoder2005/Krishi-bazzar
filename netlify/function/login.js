const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "../../users.json");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { email, password } = JSON.parse(event.body);

  if (!email || !password) {
    return { statusCode: 400, body: "Email and password required" };
  }

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return { statusCode: 401, body: "Invalid email or password" };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, user }),
  };
};
