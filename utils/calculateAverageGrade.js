function calculateAverageGrade(studentModules) {
  let totalGrades = 0;
  let gradeCount = 0;

  studentModules.forEach((result) => {
    let gradeToAdd = 0;

    // Ensure the grade fields exist and are valid before using them
    if (
      result.first_result === "fail" ||
      result.first_result === "excused" ||
      result.first_result === "absent"
    ) {
      // If resit result is "pass capped" and no resit grade, assign 40
      if (result.resit_result === "pass capped") {
        gradeToAdd = 40;
      } else if (
        result.resit_grade &&
        !isNaN(result.resit_grade) && // Check if resit_grade is a valid number
        result.resit_grade !== ''
      ) {
        gradeToAdd = parseInt(result.resit_grade, 10);
      }
    } else if (result.first_result === "pass capped") {
      gradeToAdd = 40;
    } else if (
      result.first_grade &&
      !isNaN(result.first_grade) && // Check if first_grade is a valid number
      result.first_grade !== ''
    ) {
      gradeToAdd = parseInt(result.first_grade, 10);
    }

    // Only add to total if we have a valid grade
    if (gradeToAdd !== 0) {
      totalGrades += gradeToAdd;
      gradeCount++;
    }
  });

  // Return the average, or 0 if no grades were found
  return gradeCount > 0 ? Math.floor(totalGrades / gradeCount) : 0;
}
module.exports = calculateAverageGrade;