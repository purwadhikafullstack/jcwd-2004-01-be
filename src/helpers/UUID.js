const { customAlphabet } = require("nanoid");

const uuidCode = (prefix) => {
  const nanoid = customAlphabet("1234567890abcdef", 10);
  const nanoidSuffix = customAlphabet("1234567890abcdef", 3);
  return `${prefix}-${nanoid()}-${nanoidSuffix()}`;
};

module.exports = {
  uuidCode,
};
