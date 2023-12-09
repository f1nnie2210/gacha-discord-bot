const Discord = require("discord.js");
const config = require("./config.json");
const client = new Discord.Client();
const fs = require("fs");
const prefix = "$";
const mysql = require("mysql");
const cloudinary = require("cloudinary").v2;

const con = mysql.createConnection({
  host: config.host,
  user: config.user,
  password: config.password,
  database: config.database,
});

const cloudinaryConfig = config.cloudinary;
cloudinary.config(cloudinaryConfig);

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
  pre: handlePreGacha,
};

/****** Item list ******/
const gunItems = {
  "1-star": [
    {
      name: "Colt45",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107473/gacha-discord-bot/gun/colt45.png",
    },
    {
      name: "Pistol",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107473/gacha-discord-bot/gun/silenced-pistol.png",
    },
    {
      name: "20 đạn súng lục",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107473/gacha-discord-bot/gun/pistol-bullet.png",
    },
  ],
  "2-star": [
    {
      name: "Tec9",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107474/gacha-discord-bot/gun/tec9.png",
    },
    {
      name: "Uzi",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107474/gacha-discord-bot/gun/uzi.png",
    },
    {
      name: "30 đạn tiểu liên",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107474/gacha-discord-bot/gun/smg-bullet.png",
    },
  ],
  "3-star": [
    {
      name: "Shotgun",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107473/gacha-discord-bot/gun/shotgun.png",
    },
    {
      name: "Deagle",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107473/gacha-discord-bot/gun/desert-eagle.png",
    },
    {
      name: "40 đạn súng lục",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107473/gacha-discord-bot/gun/pistol-bullet.png",
    },
    {
      name: "40 đạn shotgun",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107474/gacha-discord-bot/gun/shotgun-bullet.png",
    },
  ],
  "4-star": [
    {
      name: "Mp5",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107473/gacha-discord-bot/gun/mp5.png",
    },
    {
      name: "40 đạn tiểu liên",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107474/gacha-discord-bot/gun/smg-bullet.png",
    },
  ],
};

const carItems = {
  "1-star": [
    {
      name: "Yosemite",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/yosemite.jpg",
    },
  ],
  "2-star": [
    {
      name: "Pony",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/pony.jpg",
    },
    {
      name: "RCVan",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/vans.jpg",
    },
  ],
  "3-star": [
    {
      name: "Burrito",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/burrito.jpg",
    },
  ],
  "4-star": [
    {
      name: "Rumpo",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/rumpo.jpg",
    },
    {
      name: "Boxville",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/boxville.jpg",
    },
  ],
  "5-star": [
    {
      name: "Benson",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/benson.png",
    },
  ],
  "6-star": [
    {
      name: "Mule",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/car/mule.png",
    },
  ],
};

const vehItems = {
  "1-star": [
    {
      name: "Feltzer",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107469/gacha-discord-bot/veh/1/feltzer.png",
    },
    {
      name: "Windsor",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107470/gacha-discord-bot/veh/1/windsor.png",
    },
    {
      name: "Hermes",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107469/gacha-discord-bot/veh/1/hermes.png",
    },
    {
      name: "Mesa",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107469/gacha-discord-bot/veh/1/mesa.png",
    },
  ],
  "2-star": [
    {
      name: "Broadway",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107470/gacha-discord-bot/veh/2/broadway.png",
    },
    {
      name: "Hustler",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107471/gacha-discord-bot/veh/2/hustler.png",
    },
    {
      name: "Blade",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107470/gacha-discord-bot/veh/2/blade.png",
    },
    {
      name: "Comet",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107470/gacha-discord-bot/veh/2/comet.png",
    },
  ],
  "3-star": [
    {
      name: "Slamvan",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107471/gacha-discord-bot/veh/3/slamvan.png",
    },
    {
      name: "Savanna",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107471/gacha-discord-bot/veh/3/savanna.png",
    },
    {
      name: "Voodoo",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107471/gacha-discord-bot/veh/3/voodoo.png",
    },
    {
      name: "Remington",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107471/gacha-discord-bot/veh/3/remington.png",
    },
  ],
  "4-star": [
    {
      name: "Elegant",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107472/gacha-discord-bot/veh/4/elegant.png",
    },
    {
      name: "Landstalker",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107469/gacha-discord-bot/veh/4/landstalker.png",
    },
    {
      name: "Sabre",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107470/gacha-discord-bot/veh/4/sabre.png",
    },
  ],
  "5-star": [
    {
      name: "PCJ-600",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107470/gacha-discord-bot/veh/5/pcj-600.png",
    },
    {
      name: "Rancher",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107470/gacha-discord-bot/veh/5/rancher.png",
    },
  ],
  "6-star": [
    {
      name: "Premier",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107471/gacha-discord-bot/veh/6/premier.png",
    },
    {
      name: "Admiral ",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702107471/gacha-discord-bot/veh/6/admiral.png",
    },
  ],
};

const preItems = {
  "1-star": [
    {
      name: "Banshee",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132196/gacha-discord-bot/pre/1/banshee.jpg",
    },
    {
      name: "BF400",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132199/gacha-discord-bot/pre/1/bf-400.jpg",
    },
    {
      name: "Alpha",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132196/gacha-discord-bot/pre/1/alpha.jpg",
    },
  ],
  "2-star": [
    {
      name: "Hotring Racer",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132296/gacha-discord-bot/pre/2/hotring-racer.jpg",
    },
    {
      name: "Hotring Racer A",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132296/gacha-discord-bot/pre/2/hotring-racer.jpg",
    },
    {
      name: "Hotring Racer B",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132296/gacha-discord-bot/pre/2/hotring-racer.jpg",
    },
    {
      name: "FCR 900",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132297/gacha-discord-bot/pre/2/fcr-900.jpg",
    },
    {
      name: "Elegy",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132298/gacha-discord-bot/pre/2/elegy.jpg",
    },
  ],
  "3-star": [
    {
      name: "Buffalo",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132368/gacha-discord-bot/pre/3/buffalo.jpg",
    },
    {
      name: "Huntley",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132368/gacha-discord-bot/pre/3/huntley.jpg",
    },
  ],
  "4-star": [
    {
      name: "Cheetah",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132394/gacha-discord-bot/pre/4/cheetah.jpg",
    },
    {
      name: "Bullet",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132393/gacha-discord-bot/pre/4/bullet.jpg",
    },
  ],
  "5-star": [
    {
      name: "Sultan",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132409/gacha-discord-bot/pre/5/sultan.jpg",
    },
  ],
  "6-star": [
    {
      name: "Infernus",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132426/gacha-discord-bot/pre/6/infernus.jpg",
    },
    {
      name: "Turismo  ",
      picture:
        "https://res.cloudinary.com/f1nnie/image/upload/v1702132427/gacha-discord-bot/pre/6/turismo.jpg",
    },
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
      message.reply(
        "```Sử dụng: \n'$roll gun' để roll súng và đạn (1P).\n'$roll car' để roll xe truck (2P).\n'$roll veh' để roll xe classic (3P).\n'$roll pre' để roll xe sport (P)```"
      );
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
function handlePreGacha(message) {
  con.query(
    "SELECT * FROM users WHERE user_id = ?",
    [message.author.id],
    function (err, res) {
      if (err) console.log(err);
      if (res != "") {
        // Handle "pre" pack
        if (res[0].points >= 5) {
          const getNumber = rollPre();
          let msg = "";
          let files = "";
          let item = "";

          switch (getNumber[0]) {
            case 6:
              item = preItems["6-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star: :star: :star:`;
              files = preItems["6-star"][getNumber[1]].picture;
              break;
            case 5:
              item = preItems["5-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star: :star:`;
              files = preItems["5-star"][getNumber[1]].picture;
              break;
            case 4:
              item = preItems["4-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star: :star:`;
              files = preItems["4-star"][getNumber[1]].picture;
              break;
            case 3:
              item = preItems["3-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star: :star:`;
              files = preItems["3-star"][getNumber[1]].picture;
              break;
            case 2:
              item = preItems["2-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star: :star:`;
              files = preItems["2-star"][getNumber[1]].picture;
              break;
            default:
              item = preItems["1-star"][getNumber[1]].name;
              msg = `${message.author} got ${item} :star:`;
              files = preItems["1-star"][getNumber[1]].picture;
              break;
          }

          message.channel.send(msg, {
            files: [files],
          });
          let points = parseInt(res[0].points) - 5;
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

function rollPre() {
  const number = (Math.floor(Math.random() * 1000) + 1) * 0.1;
  if (number <= 1) {
    const random = Math.floor(Math.random() * preItems["6-star"].length);
    return [6, random];
  } else if (number <= 4) {
    const random = Math.floor(Math.random() * preItems["5-star"].length);
    return [5, random];
  } else if (number <= 19) {
    const random = Math.floor(Math.random() * preItems["4-star"].length);
    return [4, random];
  } else if (number <= 39) {
    const random = Math.floor(Math.random() * preItems["3-star"].length);
    return [3, random];
  } else if (number <= 64) {
    const random = Math.floor(Math.random() * preItems["2-star"].length);
    return [2, random];
  } else {
    const random = Math.floor(Math.random() * preItems["1-star"].length);
    return [1, random];
  }
}
