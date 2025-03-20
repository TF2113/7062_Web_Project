function calculateAverageGrade(studentModules) {
  let totalGrades = 0;
  let gradeCount = 0;

  studentModules.forEach((result) => {
    let gradeToAdd = 0;
    if (
      result.first_result === "fail" ||
      result.first_result === "excused" ||
      result.first_result === "absent"
    ) {
      if (result.resit_result === "pass capped") {
        gradeToAdd = 40; // If resit result is 'pass capped', assign 40
      } else if (
        result.resit_grade !== undefined &&
        result.resit_grade !== null
      ) {
        gradeToAdd = parseInt(result.resit_grade, 10);
      }
    } else if (result.first_result === "pass capped") {
      gradeToAdd = 40;
    } else if (
      result.first_grade !== undefined &&
      result.first_grade !== null
    ) {
      gradeToAdd = parseInt(result.first_grade, 10);
    }
    if (gradeToAdd !== 0) {
      totalGrades += gradeToAdd;
      gradeCount++;
    }
  });

  return gradeCount > 0 ? totalGrades / gradeCount : 0;
}

module.exports = calculateAverageGrade;