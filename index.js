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

const gachaHandlers = {
  gun: handleGunGacha,
  veh: handleVehGacha,
  car: handleCarGacha,
};

/****** Item list ******/
const gunItems = {
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

const carItems = {
  "1-star": [{ name: "Yosemite", picture: "./img/car/yosemite.jpg" }],
  "2-star": [
    { name: "Pony", picture: "./img/car/pony.jpg" },
    { name: "RCVan", picture: "./img/car/vans.jpg" },
  ],
  "3-star": [{ name: "Burrito", picture: "./img/car/burrito.jpg" }],
  "4-star": [
    { name: "Rumpo", picture: "./img/car/rumpo.jpg" },
    { name: "Boxville", picture: "./img/car/boxville.jpg" },
  ],
  "5-star": [{ name: "Benson", picture: "./img/car/benson.png" }],
  "6-star": [{ name: "Mule", picture: "./img/car/mule.png" }],
};

const vehItems = {
  "1-star": [
    { name: "Feltzer", picture: "./img/veh/1/Feltzer.png" },
    { name: "Windsor", picture: "./img/veh/1/Windsor.png" },
    { name: "Hermes", picture: "./img/veh/1/Hermes.png" },
    { name: "Mesa", picture: "./img/veh/1/Mesa.png" },
  ],
  "2-star": [
    { name: "Broadway", picture: "./img/veh/2/Broadway.png" },
    { name: "Hustler", picture: "./img/veh/2/Hustler.png" },
    { name: "Blade", picture: "./img/veh/2/Blade.png" },
    { name: "Comet", picture: "./img/veh/2/Comet.png" },
  ],
  "3-star": [
    { name: "Slamvan", picture: "./img/veh/3/Slamvan.png" },
    { name: "Savanna", picture: "./img/veh/3/Savanna.png" },
    { name: "Voodoo", picture: "./img/veh/3/Voodoo.png" },
    { name: "Remington", picture: "./img/veh/3/Remington.png" },
  ],
  "4-star": [
    { name: "Elegant", picture: "./img/veh/4/Elegant.png" },
    { name: "Landstalker", picture: "./img/veh/4/Landstalker.png" },
    { name: "Sabre", picture: "./img/veh/4/Sabre.png" },
  ],
  "5-star": [
    { name: "PCJ-600", picture: "./img/veh/5/PCJ-600.png" },
    { name: "Rancher", picture: "./img/veh/5/Rancher.png" },
  ],
  "6-star": [
    { name: "Premier", picture: "./img/veh/6/Premier.png" },
    { name: "Admiral ", picture: "./img/veh/6/Admiral.png" },
  ],
};

client.on("message", function (message) {
  if (message.author.bot) return;

  let command = "";
  let args = [];

  if (message.content.startsWith(prefix)) {
    const commandBody = message.content.slice(prefix.length);
    args = commandBody.split(" ");
    command = args.shift().toLowerCase();
  } else {
    // Handle message without prefix
  }
  /****** $ping: check bot response ******/
  if (command == "ping") {
    const timeTaken = Date.now() - message.createdTimestamp;
    message.reply(`${timeTaken} ms`);
  }

  /****** $setting addchannel <#channel>: allowed channel using $roll ******/
  if (command == "setting") {
    if (args[0] == "addchannel") {
      let set_channel = args[1].split("#");
      set_channel = set_channel[1].split(">");
      set_channel = set_channel[0];

      // Check if allowed channel is already exist
      con.query(
        "SELECT * FROM allowed_channels WHERE channel_id = ?",
        [set_channel],
        function (err, res) {
          if (err) console.log(err);
          if (res != "") {
            message.channel.send(`Kênh ${args[1]} đã được thêm trước đó.`);
          } else {
            // add allowed channel
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

  /****** $register: register ******/
  if (command == "register") {
    const username = message.author.username;
    const user_id = message.author.id;
    const ic = args[0]; // get ic from command

    if (!ic) {
      message.reply("Bạn phải cung cấp một IC hợp lệ. Ví dụ: Finn_Frederick");
      return;
    }

    // using regex pattern to check ic
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

  /****** $points: get player's point ******/
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

  /****** $roll: handle gacha pack ******/
  if (command === "roll") {
    const gachaType = args[0];

    if (gachaHandlers[gachaType]) {
      con.query(
        "SELECT * FROM allowed_channels WHERE channel_id = ?",
        [message.channel.id],
        function (err, settingRes) {
          if (err) {
            console.log(err);
          } else {
            if (settingRes.length > 0) {
              gachaHandlers[gachaType](message);
            } else {
              message.reply("Bạn không thể sử dụng lệnh gacha ở kênh này.");
            }
          }
        }
      );
    } else {
      message.reply("Sử dụng '$roll gun' || '$roll car' || '$roll veh'.");
    }
  }

  /****** $setpoints: set point (only specify roles) ******/
  if (command == "setpoints") {
    const allowedRoles = ["GachaPW"]; // Allowed roles
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

    // Check if target user has account in database
    const sqlCheckAccount = "SELECT * FROM users WHERE user_id = ?";
    con.query(sqlCheckAccount, [targetUser.id], function (err, result) {
      if (err) {
        message.reply("Lỗi khi kiểm tra tài khoản.");
        console.error(err);
      } else if (result.length === 0) {
        message.reply("Người dùng này không có tài khoản.");
      } else {
        // Update point if account is already existing
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

  /****** $help: help command ******/
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

/******func: handle gacha pack ******/
function handleGunGacha(message) {
  con.query(
    "SELECT * FROM users WHERE user_id = ?",
    [message.author.id],
    function (err, res) {
      if (err) console.log(err);
      if (res != "") {
        // Handle "gun" pack
        if (res[0].points >= 1) {
          const getNumber = rollGun();
          let msg = "";
          let files = "";
          let item = "";

          switch (getNumber[0]) {
            case 4:
              item = gunItems["4-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star:`;
              files = gunItems["4-star"][getNumber[1]].picture;
              break;
            case 3:
              item = gunItems["3-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star:`;
              files = gunItems["3-star"][getNumber[1]].picture;
              break;
            case 2:
              item = gunItems["2-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star:`;
              files = gunItems["2-star"][getNumber[1]].picture;
              break;
            default:
              item = gunItems["1-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star:`;
              files = gunItems["1-star"][getNumber[1]].picture;
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

          // Save result into gacha_result
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
        // Handle "car" pack
        if (res[0].points >= 2) {
          const getNumber = rollCar();
          let msg = "";
          let files = "";
          let item = "";

          switch (getNumber[0]) {
            case 6:
              item = carItems["6-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star: :star: :star:`;
              files = carItems["6-star"][getNumber[1]].picture;
              break;
            case 5:
              item = carItems["5-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star: :star:`;
              files = carItems["5-star"][getNumber[1]].picture;
              break;
            case 4:
              item = carItems["4-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star:`;
              files = carItems["4-star"][getNumber[1]].picture;
              break;
            case 3:
              item = carItems["3-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star:`;
              files = carItems["3-star"][getNumber[1]].picture;
              break;
            case 2:
              item = carItems["2-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star:`;
              files = carItems["2-star"][getNumber[1]].picture;
              break;
            default:
              item = carItems["1-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star:`;
              files = carItems["1-star"][getNumber[1]].picture;
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

          // Save result into gacha_result
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

function handleVehGacha(message) {
  con.query(
    "SELECT * FROM users WHERE user_id = ?",
    [message.author.id],
    function (err, res) {
      if (err) console.log(err);
      if (res != "") {
        // Handle "car" pack
        if (res[0].points >= 3) {
          const getNumber = rollVeh();
          let msg = "";
          let files = "";
          let item = "";

          switch (getNumber[0]) {
            case 6:
              item = vehItems["6-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star: :star: :star:`;
              files = vehItems["6-star"][getNumber[1]].picture;
              break;
            case 5:
              item = vehItems["5-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star: :star:`;
              files = vehItems["5-star"][getNumber[1]].picture;
              break;
            case 4:
              item = vehItems["4-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star:`;
              files = vehItems["4-star"][getNumber[1]].picture;
              break;
            case 3:
              item = vehItems["3-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star:`;
              files = vehItems["3-star"][getNumber[1]].picture;
              break;
            case 2:
              item = vehItems["2-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star:`;
              files = vehItems["2-star"][getNumber[1]].picture;
              break;
            default:
              item = vehItems["1-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star:`;
              files = vehItems["1-star"][getNumber[1]].picture;
              break;
          }

          message.channel.send(msg, {
            files: [files],
          });
          let points = parseInt(res[0].points) - 3;
          con.query(
            "UPDATE users SET points = ? WHERE user_id = ?",
            [points, message.author.id],
            function (err, res) {
              if (err) console.log(err);
              if (res) console.log(res);
            }
          );

          // Save result into gacha_result
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
          message.reply("Không đủ point, bạn cần ít nhất 3 point để roll veh");
        }
      } else {
        message.reply(
          "Bạn chưa đăng ký tài khoản gacha. Nhập $register để đăng kí tài khoản"
        );
      }
    }
  );
}

/****** $func roll: gacha percentage ******/
function rollGun() {
  const number = (Math.floor(Math.random() * 1000) + 1) * 0.1;
  if (number <= 1) {
    const random = Math.floor(Math.random() * gunItems["4-star"].length);
    return [4, random];
  } else if (number <= 11) {
    const random = Math.floor(Math.random() * gunItems["3-star"].length);
    return [3, random];
  } else if (number <= 31) {
    const random = Math.floor(Math.random() * gunItems["2-star"].length);
    return [2, random];
  } else {
    const random = Math.floor(Math.random() * gunItems["1-star"].length);
    return [1, random];
  }
}

function rollCar() {
  const number = (Math.floor(Math.random() * 1000) + 1) * 0.1;
  if (number <= 1) {
    const random = Math.floor(Math.random() * carItems["6-star"].length);
    return [6, random];
  } else if (number <= 3) {
    const random = Math.floor(Math.random() * carItems["5-star"].length);
    return [5, random];
  } else if (number <= 18) {
    const random = Math.floor(Math.random() * carItems["4-star"].length);
    return [4, random];
  } else if (number <= 40) {
    const random = Math.floor(Math.random() * carItems["3-star"].length);
    return [3, random];
  } else if (number <= 70) {
    const random = Math.floor(Math.random() * carItems["2-star"].length);
    return [2, random];
  } else {
    const random = Math.floor(Math.random() * carItems["1-star"].length);
    return [1, random];
  }
}

function rollVeh() {
  const number = (Math.floor(Math.random() * 1000) + 1) * 0.1;
  if (number <= 1) {
    const random = Math.floor(Math.random() * vehItems["6-star"].length);
    return [6, random];
  } else if (number <= 4) {
    const random = Math.floor(Math.random() * vehItems["5-star"].length);
    return [5, random];
  } else if (number <= 14) {
    const random = Math.floor(Math.random() * vehItems["4-star"].length);
    return [4, random];
  } else if (number <= 34) {
    const random = Math.floor(Math.random() * vehItems["3-star"].length);
    return [3, random];
  } else if (number <= 62) {
    const random = Math.floor(Math.random() * vehItems["2-star"].length);
    return [2, random];
  } else {
    const random = Math.floor(Math.random() * vehItems["1-star"].length);
    return [1, random];
  }
}
