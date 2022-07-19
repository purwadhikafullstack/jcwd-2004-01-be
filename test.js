// const bcrypt = require('bcrypt');
// const { generateFromEmail } = require("unique-username-generator");

// const hashPassword = async (password) => {
//     const hash = await bcrypt.hash(password, 10);
//     return hash
//     // console.log(hash);
//     // const compare = await bcrypt.compare("maria", "$2b$10$tIYhIjxpPN.6TG/UIBrruOPyYJg507flhKx9kV/eEbkFnAn63q/Au")
//     // console.log(compare)
// };

// console.log(hashPassword("maria"))

// const hash = bcrypt.hash("maria", 10)
// console.log(hash)

// let name = "Sebastian Vettel"

// let username = name.toLowerCase().split(" ").join("");

// console.log(username)

// const username = generateFromEmail(
//     "lakshmi.narayan@example.com"
//   );
//   console.log(username); // lakshminarayan234

// let userData = {};
// let a = [1, 2, 3];
// userData = { ...userData, a };
// console.log(userData);

// const { customAlphabet } = require("nanoid");

// const nanoid = customAlphabet("1234567890abcdef", 10);
// const nanoidSuffix = customAlphabet("1234567890abcdef", 3);
// let userID = `TRA-${nanoid()}-${nanoidSuffix()}`;

// console.log(userID);

// const { uuid } = require("./src/helpers/UUID");

// console.log(uuid("HEY"));
// const dayjs = require("dayjs");

// const date = dayjs(new Date()).format("YYYYMMDD");

// console.log(date);

// const job = schedule.scheduleJob("5 * * * * *", testNodeSchedule());
// const schedule = require("node-schedule");

// schedule.scheduleJob("/5 * * * * *", function async() {
//   console.log("The answer to life, the universe, and everything!");
// });
