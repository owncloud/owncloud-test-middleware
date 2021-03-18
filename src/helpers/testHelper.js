/**
 * custom sleep
 *
 *  @param {number} time
 */
exports.customDelay = function customDelay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};
