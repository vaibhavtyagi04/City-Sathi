function assignDepartment(category) {
  if (category === "garbage") return "sanitation";
  if (category === "pothole") return "roads";
  if (category === "street_light" || category === "streetlight") return "electricity";
  if (category === "drainage") return "drainage";
  if (category === "stray_animal" || category === "stray animal") return "ngo";
  return "general";
}

module.exports = { assignDepartment };
