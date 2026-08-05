export default async function (req: any, res: any) {
  console.log("DIRECT HANDLER HIT");
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({
    success: true,
    url: req.url
  }));
}
