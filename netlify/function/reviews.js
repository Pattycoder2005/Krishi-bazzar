let reviews = [];

exports.handler = async (event) => {
  if (event.httpMethod === "POST") {
    const { name, message } = JSON.parse(event.body);
    if (!name || !message) {
      return { statusCode: 400, body: "Name and message required" };
    }
    const review = { name, message, date: new Date() };
    reviews.push(review);
    return { statusCode: 200, body: JSON.stringify({ success: true, review }) };
  }

  if (event.httpMethod === "GET") {
    return { statusCode: 200, body: JSON.stringify(reviews) };
  }

  return { statusCode: 405, body: "Method Not Allowed" };
};
