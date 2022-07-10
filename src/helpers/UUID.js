const { customAlphabet } = require("nanoid");
const dayjs = require("dayjs");

const uuidCode = (prefix) => {
  const nanoid = customAlphabet("1234567890abcdef", 10);
  const nanoidSuffix = customAlphabet("1234567890abcdef", 3);
  return `${prefix}-${nanoid()}-${nanoidSuffix()}`;
};

const codeGenerator = (prefix, suffix) => {
  const date = dayjs(new Date()).format("YYYYMMDD");
  const nanoid = customAlphabet("1234567890abcdef", 3);
  return `${prefix}-${date}${nanoid()}-${suffix}`;
};

module.exports = {
  uuidCode,
  codeGenerator,
};
