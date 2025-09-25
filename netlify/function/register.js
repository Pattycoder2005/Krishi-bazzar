const fs = require("fs");
const path = require("path");

const usersFile = path.join(__dirname, "../../users.json");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { name, email, phone, state, farm, message, password } = JSON.parse(event.body);

  if (!email || !name) {
    return { statusCode: 400, body: "Missing required fields" };
  }

  let users = [];
  if (fs.existsSync(usersFile)) {
    users = JSON.parse(fs.readFileSync(usersFile));
  }

  if (users.find((u) => u.email === email)) {
    return { statusCode: 400, body: "User already registered. Please log in." };
  }

  const newUser = { name, email, phone, state, farm, message, password };
  users.push(newUser);
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, message: "Registration successful!" }),
  };
};
