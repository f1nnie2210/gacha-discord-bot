const Discord = require("discord.js");
const config = require("./config.json");
const client = new Discord.Client();
const fs = require("fs");
const prefix = "$";
const mysql = require("mysql");
const con = mysql.createConnection({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
});

const characters = {
  "1-star": [
    { name: "colt45", picture: "./img/colt45.png" },
    { name: "pistol", picture: "./img/pistol.png" },
    { name: "20 đạn súng lục", picture: "./img/lucammo.png" },
    // Thêm thông tin cho các vật phẩm 1 sao
  ],
  "2-star": [
    { name: "tec9", picture: "./img/tec9.png" },
    { name: "uzi", picture: "./img/uzi.png" },
    { name: "30 đạn tiểu liên", picture: "./img/tieulienammo.png" },
    // Thêm thông tin cho các vật phẩm 3 sao
  ],
  "3-star": [
    { name: "shotgun", picture: "./img/shotgun.png" },
    { name: "deagle", picture: "./img/deagle.png" },
    { name: "40 đạn súng lục", picture: "./img/lucammo.png" },
    { name: "40 đạn shotgun", picture: "./img/shotgunammo.png" },
    // Thêm thông tin cho vp 4 sao
  ],
  "4-star": [
    { name: "mp5", picture: "./img/mp5.png" },
    { name: "40 đạn tiểu liên", picture: "./img/tieulienammo.png" },
  ],
};

client.on("message", function (message) {
  // console.log(message)
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) {
    con.query(
      "SELECT * FROM setting WHERE idx = ?",
      ["channel"],
      function (err, res) {
        if (err) console.log(err);
        if (res != "") {
          if (res[0].value == message.channel.id) {
          }
        }
      }
    );
  }

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(" ");
  const command = args.shift().toLowerCase();

  if (command == "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`${timeTaken} ms`);
  }

  if (command == "setting") {
    if (args[0] == "channel") {
      let set_channel = args[1].split("#");
      set_channel = set_channel[1].split(">");
      set_channel = set_channel[0];
      con.query(
        "SELECT * FROM setting WHERE idx = ?",
        ["channel"],
        function (err, res) {
          if (err) console.log(err);
          if (res != "") {
            con.query(
              "UPDATE setting SET value = ? WHERE idx = 'channel'",
              [set_channel],
              function (err, upd) {
                if (err) console.log(err);
                if (upd) message.channel.send(`Update to channel ${args[1]}`);
              }
            );
          } else {
            con.query(
              "INSERT INTO setting (idx, value) VALUES ('channel', ?)",
              [set_channel],
              function (err, res) {
                if (err) console.log(err);
                if (res) {
                  message.channel.send(`Create to channel ${args[1]}`);
                }
              }
            );
          }
        }
      );
      return;
    }
  }

  if (command == "register") {
    let sql = "SELECT * FROM users WHERE user_id = ?";
    con.query(sql, [message.author.id], function (err, result) {
      if (err) throw err;
      if (result != "") {
        message.reply("You are already registered!!");
        return;
      }
      sql =
        "INSERT INTO users (user_id, username, discriminator, points) VALUES (?, ?, ?, ?)";
      con.query(
        sql,
        [
          message.author.id,
          message.author.username,
          message.author.discriminator,
          0,
        ],
        function (err, result) {
          if (err) throw err;
          if (result) {
            message.reply(
              "Bạn đã đăng ký tài khoản gacha thành công! Hãy sử dụng $roll để bắt đầu gacha"
            );
            return;
          }
        }
      );
    });
  }

  if (command == "points") {
    let sql = "SELECT * FROM users WHERE user_id = ?";
    con.query(sql, [message.author.id], function (err, result) {
      if (err) throw err;
      if (result != "") {
        const points = result[0].points;
        if (points !== null && points !== undefined) {
          if (points === 0) {
            message.reply("Bạn không có điểm.");
          } else {
            message.reply(`Số điểm hiện tại của bạn là: ${points}`);
          }
        } else {
          message.reply("Lỗi: Không thể xác định điểm của bạn.");
        }
      } else {
        message.reply(
          "Bạn phải đăng ký tài khoản gacha trước. Nhập $register để đăng ký tài khoản."
        );
      }
    });
  }

  if (command == "roll") {
    con.query(
      "SELECT * FROM users WHERE user_id = ?",
      [message.author.id],
      function (err, res) {
        if (err) console.log(err);
        if (res != "") {
          if (res[0].points >= 1) {
            const getNumber = roll();
            let msg = "";
            let files = "";
            let character = "";

            switch (getNumber[0]) {
              case 4:
                character = characters["4-star"][getNumber[1]].name;
                msg = `You Got ${character} :star: :star: :star: :star:`;
                files = characters["4-star"][getNumber[1]].picture;
                break;
              case 3:
                character = characters["3-star"][getNumber[1]].name;
                msg = `You Got ${character} :star: :star: :star:`;
                files = characters["3-star"][getNumber[1]].picture;
                break;
              case 2:
                character = characters["2-star"][getNumber[1]].name;
                msg = `You Got ${character} :star: :star:`;
                files = characters["2-star"][getNumber[1]].picture;
                break;
              default:
                character = characters["1-star"][getNumber[1]].name;
                msg = `You Got ${character} :star:`;
                files = characters["1-star"][getNumber[1]].picture;
                break;
            }

            message.channel.send(msg, {
              files: [files],
            });
            let points = parseInt(res[0].points) - 1;
            con.query(
              "UPDATE users SET points = ? WHERE user_id = ?",
              [points, message.author.id],
              function (err, res) {
                //update points
                if (err) console.log(err);
                if (res) console.log(res);
              }
            );
          } else {
            message.reply("Không đủ point, bạn cần ít nhất 1 point để quay");
          }
        } else {
          message.reply(
            "Bạn chưa đăng ký tài khoản gacha. Nhập $register để đăng kí tài khoản"
          );
        }
      }
    );
  }

  if (command == "setpoints") {
    const allowedRoles = ["GachaPW"]; // Các vai trò được phép
    let hasPermission = false;

    message.member.roles.cache.forEach((role) => {
      if (allowedRoles.includes(role.name)) {
        hasPermission = true;
      }
    });

    if (!hasPermission) {
      message.reply("Bạn không có quyền truy cập lệnh này.");
      return;
    }

    const targetUser = message.mentions.users.first();
    const newPoints = parseInt(args[1]);

    if (!targetUser || isNaN(newPoints)) {
      message.reply("Sử dụng cú pháp sai. Ví dụ: $setpoints @username 1");
      return;
    }

    // Kiểm tra xem người dùng có tài khoản không
    const sqlCheckAccount = "SELECT * FROM users WHERE user_id = ?";
    con.query(sqlCheckAccount, [targetUser.id], function (err, result) {
      if (err) {
        message.reply("Lỗi khi kiểm tra tài khoản.");
        console.error(err);
      } else if (result.length === 0) {
        message.reply("Người dùng này không có tài khoản.");
      } else {
        // Cập nhật điểm nếu tài khoản tồn tại
        const sqlUpdatePoints = "UPDATE users SET points = ? WHERE user_id = ?";
        con.query(
          sqlUpdatePoints,
          [newPoints, targetUser.id],
          function (err, result) {
            if (err) {
              message.reply("Lỗi: Không thể cập nhật điểm.");
              console.error(err);
            } else {
              message.reply(
                `Điểm của ${targetUser.username} đã được cập nhật thành ${newPoints}`
              );
            }
          }
        );
      }
    });
  }

  if (command == "help") {
    con.query(
      "SELECT * FROM setting WHERE idx = ?",
      ["channel"],
      function (err, res) {
        if (err) console.log(err);
        if (res) {
          var msg = "Welcome to RCRP Gacha!\r\n";
          msg += "Sử dụng prefix $\r\n";
          message.channel.send(msg);
        }
      }
    );
  }
});

client.login(config.BOT_TOKEN);

function roll() {
  const number = (Math.floor(Math.random() * 1000) + 1) * 0.1;
  if (number <= 1) {
    const random = Math.floor(Math.random() * characters["4-star"].length);
    console.log(random);
    return [4, random];
  } else if (number <= 11) {
    const random = Math.floor(Math.random() * characters["3-star"].length);
    console.log(random);
    return [3, random];
  } else if (number <= 31) {
    const random = Math.floor(Math.random() * characters["2-star"].length);
    console.log(random);
    return [2, random];
  } else {
    const random = Math.floor(Math.random() * characters["1-star"].length);
    console.log(random);
    return [1, random];
  }
}
