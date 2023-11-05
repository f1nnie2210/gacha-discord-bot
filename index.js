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

con.connect(function (err) {
  if (err) {
    console.error("Lỗi kết nối cơ sở dữ liệu: " + err.stack);
    return;
  }
  console.log("Kết nối cơ sở dữ liệu thành công với ID " + con.threadId);
});

/****** Item list ******/
const gun_items = {
  "1-star": [
    { name: "Colt45", picture: "./img/gun/colt45.png" },
    { name: "Pistol", picture: "./img/gun/pistol.png" },
    { name: "20 đạn súng lục", picture: "./img/gun/lucammo.png" },
  ],
  "2-star": [
    { name: "Tec9", picture: "./img/gun/tec9.png" },
    { name: "Uzi", picture: "./img/gun/uzi.png" },
    { name: "30 đạn tiểu liên", picture: "./img/gun/tieulienammo.png" },
  ],
  "3-star": [
    { name: "Shotgun", picture: "./img/gun/shotgun.png" },
    { name: "Deagle", picture: "./img/gun/deagle.png" },
    { name: "40 đạn súng lục", picture: "./img/gun/lucammo.png" },
    { name: "40 đạn shotgun", picture: "./img/gun/shotgunammo.png" },
  ],
  "4-star": [
    { name: "Mp5", picture: "./img/gun/mp5.png" },
    { name: "40 đạn tiểu liên", picture: "./img/gun/tieulienammo.png" },
  ],
};

const car_items = {
  "1-star": [{ name: "Walton", picture: "./img/car/walton.jpg" }],
  "2-star": [{ name: "Yosemite", picture: "./img/car/yosemite.jpg" }],
  "3-star": [
    { name: "Pony", picture: "./img/car/pony.jpg" },
    { name: "RCVan", picture: "./img/car/vans.jpg" },
  ],
  "4-star": [
    { name: "Burrito", picture: "./img/car/burrito.jpg" },
    { name: "Boxville", picture: "./img/car/boxville.jpg" },
  ],
  "5-star": [{ name: "Rumpo", picture: "./img/car/rumpo.jpg" }],
};

client.on("message", function (message) {
  if (message.author.bot) return;

  // Tách lệnh và đối số
  let command = "";
  let args = [];

  if (message.content.startsWith(prefix)) {
    const commandBody = message.content.slice(prefix.length);
    args = commandBody.split(" ");
    command = args.shift().toLowerCase();
  } else {
    // Xử lý tin nhắn bình thường khi không có prefix
  }
  /****** $ping: Kiểm tra ping bot ******/
  if (command == "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`${timeTaken} ms`);
  }

  /****** $setting addchannel <#channel>: Thêm kênh được phép $roll ******/
  if (command == "setting") {
    if (args[0] == "addchannel") {
      let set_channel = args[1].split("#");
      set_channel = set_channel[1].split(">");
      set_channel = set_channel[0];

      // Kiểm tra xem kênh đã được thêm trước đó hay chưa
      con.query(
        "SELECT * FROM allowed_channels WHERE channel_id = ?",
        [set_channel],
        function (err, res) {
          if (err) console.log(err);
          if (res != "") {
            message.channel.send(`Kênh ${args[1]} đã được thêm trước đó.`);
          } else {
            // Thêm kênh vào danh sách được phép
            con.query(
              "INSERT INTO allowed_channels (channel_id, created_at) VALUES (?, NOW())",
              [set_channel],
              function (err, res) {
                if (err) console.log(err);
                if (res) {
                  message.channel.send(
                    `Đã thêm kênh ${args[1]} vào danh sách được phép.`
                  );
                }
              }
            );
          }
        }
      );
      return;
    }
  }

  /****** $register: tạo tài khoản ******/
  if (command == "register") {
    const username = message.author.username;
    const user_id = message.author.id;
    const ic = args[0]; // Lấy ic từ đối số dòng lệnh

    if (!ic) {
      message.reply("Bạn phải cung cấp một IC hợp lệ. Ví dụ: Finn_Frederick");
      return;
    }

    // Sử dụng biểu thức chính quy để kiểm tra ic
    const icRegex = /^[a-zA-Z]+_[a-zA-Z]+(?:_[a-zA-Z]+)*$/;

    if (!icRegex.test(ic)) {
      message.reply(
        "IC phải bắt đầu bằng một chữ cái, và sau đó cách nhau bằng dấu '_' và ít nhất 2 từ."
      );
      return;
    }

    let sql = "SELECT * FROM users WHERE user_id = ?";
    con.query(sql, [user_id], function (err, result) {
      if (err) throw err;
      if (result != "") {
        message.reply("Bạn đã đăng ký tài khoản gacha rồi");
        return;
      }
      sql =
        "INSERT INTO users (user_id, username, ic, points, created_at) VALUES (?, ?, ?, ?, NOW())";
      con.query(sql, [user_id, username, ic, 0], function (err, result) {
        if (err) throw err;
        if (result) {
          message.reply(
            "Bạn đã đăng ký tài khoản gacha thành công! Hãy sử dụng $roll để bắt đầu gacha"
          );
          return;
        }
      });
    });
  }

  /****** $points: xem điểm ******/
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

  /****** $roll: quay gacha theo pack ******/
  if (command === "roll") {
    const gachaType = args[0];

    if (gachaType === "gun" || gachaType === "car") {
      con.query(
        "SELECT * FROM allowed_channels WHERE channel_id = ?",
        [message.channel.id],
        function (err, settingRes) {
          if (err) {
            console.log(err);
          } else {
            if (settingRes.length > 0) {
              if (gachaType === "gun") {
                handleGunGacha(message);
              } else {
                handleCarGacha(message);
              }
            } else {
              message.reply("Bạn không thể sử dụng lệnh gacha ở kênh này.");
            }
          }
        }
      );
    } else {
      message.reply("Sử dụng '$roll gun' hoặc '$roll car'.");
    }
  }

  /****** $setpoints: Set điểm (admin) ******/
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

  /****** $help: hỗ trợ bot ******/
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

/******func: Xử lý gacha theo gói ******/
function handleGunGacha(message) {
  con.query(
    "SELECT * FROM users WHERE user_id = ?",
    [message.author.id],
    function (err, res) {
      if (err) console.log(err);
      if (res != "") {
        // Xử lý quay gacha cho gói "gun"
        if (res[0].points >= 1) {
          const getNumber = rollgun();
          let msg = "";
          let files = "";
          let item = "";

          switch (getNumber[0]) {
            case 4:
              item = gun_items["4-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star:`;
              files = gun_items["4-star"][getNumber[1]].picture;
              break;
            case 3:
              item = gun_items["3-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star:`;
              files = gun_items["3-star"][getNumber[1]].picture;
              break;
            case 2:
              item = gun_items["2-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star:`;
              files = gun_items["2-star"][getNumber[1]].picture;
              break;
            default:
              item = gun_items["1-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star:`;
              files = gun_items["1-star"][getNumber[1]].picture;
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
              if (err) console.log(err);
              if (res) console.log(res);
            }
          );

          // Lưu kết quả vào bảng gacha_result
          const userId = message.author.id;
          const ic = res[0].ic;
          const itemName = item;
          con.query(
            "INSERT INTO gacha_result_gun (user_id, ic, gun_name, created_at) VALUES (?, ?, ?, NOW())",
            [userId, ic, itemName],
            function (err, res) {
              if (err) console.log(err);
              if (res) console.log("Kết quả gacha đã được lưu.");
            }
          );
        } else {
          message.reply("Không đủ point, bạn cần ít nhất 1 point để roll gun");
        }
      } else {
        message.reply(
          "Bạn chưa đăng ký tài khoản gacha. Nhập $register để đăng kí tài khoản"
        );
      }
    }
  );
}

function handleCarGacha(message) {
  con.query(
    "SELECT * FROM users WHERE user_id = ?",
    [message.author.id],
    function (err, res) {
      if (err) console.log(err);
      if (res != "") {
        // Xử lý quay gacha cho gói "car"
        if (res[0].points >= 1) {
          const getNumber = rollcar();
          let msg = "";
          let files = "";
          let item = "";

          switch (getNumber[0]) {
            case 5:
              item = car_items["5-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star: :star:`;
              files = car_items["5-star"][getNumber[1]].picture;
              break;
            case 4:
              item = car_items["4-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star:`;
              files = car_items["4-star"][getNumber[1]].picture;
              break;
            case 3:
              item = car_items["3-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star:`;
              files = car_items["3-star"][getNumber[1]].picture;
              break;
            case 2:
              item = car_items["2-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star:`;
              files = car_items["2-star"][getNumber[1]].picture;
              break;
            default:
              item = car_items["1-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star:`;
              files = car_items["1-star"][getNumber[1]].picture;
              break;
          }

          message.channel.send(msg, {
            files: [files],
          });
          let points = parseInt(res[0].points) - 2;
          con.query(
            "UPDATE users SET points = ? WHERE user_id = ?",
            [points, message.author.id],
            function (err, res) {
              if (err) console.log(err);
              if (res) console.log(res);
            }
          );

          // Lưu kết quả vào bảng gacha_result
          const userId = message.author.id;
          const ic = res[0].ic;
          const itemName = item;
          con.query(
            "INSERT INTO gacha_result_car (user_id, ic, car_name, created_at) VALUES (?, ?, ?, NOW())",
            [userId, ic, itemName],
            function (err, res) {
              if (err) console.log(err);
              if (res) console.log("Kết quả gacha đã được lưu.");
            }
          );
        } else {
          message.reply("Không đủ point, bạn cần ít nhất 2 point để roll car");
        }
      } else {
        message.reply(
          "Bạn chưa đăng ký tài khoản gacha. Nhập $register để đăng kí tài khoản"
        );
      }
    }
  );
}

/****** $func roll: tỉ lệ gacha ******/
function rollgun() {
  const number = (Math.floor(Math.random() * 1000) + 1) * 0.1;
  if (number <= 1) {
    const random = Math.floor(Math.random() * gun_items["4-star"].length);
    return [4, random];
  } else if (number <= 11) {
    const random = Math.floor(Math.random() * gun_items["3-star"].length);
    return [3, random];
  } else if (number <= 31) {
    const random = Math.floor(Math.random() * gun_items["2-star"].length);
    return [2, random];
  } else {
    const random = Math.floor(Math.random() * gun_items["1-star"].length);
    return [1, random];
  }
}

function rollcar() {
  const number = (Math.floor(Math.random() * 1000) + 1) * 0.1;
  if (number <= 1) {
    const random = Math.floor(Math.random() * car_items["5-star"].length);
    return [5, random];
  } else if (number <= 9) {
    const random = Math.floor(Math.random() * car_items["4-star"].length);
    return [4, random];
  } else if (number <= 24) {
    const random = Math.floor(Math.random() * car_items["3-star"].length);
    return [3, random];
  } else if (number <= 54) {
    const random = Math.floor(Math.random() * car_items["2-star"].length);
    return [2, random];
  } else {
    const random = Math.floor(Math.random() * car_items["1-star"].length);
    return [1, random];
  }
}
