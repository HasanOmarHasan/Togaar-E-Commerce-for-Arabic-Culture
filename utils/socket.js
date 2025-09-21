const asyncHandler = require("express-async-handler");
const Chat = require("../models/chatModel");
const User = require("../models/userModel");

// TODO
//  ) make the chat between the user and the adminSupport
//  ) make the user selet type of issue can add initial message like admin work form time to time and work days
//  ) count the number of user and admin support are connected , can make category of issueType to help the support in work
//  ) can add auth to check the user and admin

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("⚡ New client connected:", socket.id);

    // new ticket
    socket.on(
      "createTicket",
      asyncHandler(async (data) => {
        const { userId, subject, message, issueType } = data;

        if (!userId || !subject || !message) {
          return socket.emit("error", "Missing required fields");
        }

        const user = await User.findById(userId);
        if (!user) return socket.emit("error", "User not found");

        let ticket = await Chat.findOne({
          user: user._id,
          status: { $in: ["open", "in-progress"] },
          type: "support",
        });
        if (!ticket)
          ticket = await Chat.create({
            chatName: subject || "Support Ticket",
            issueType: issueType || "general",
            user: user._id,
            status: "open",
            type: "support",
            messages: [{ role: "user", content: message, sender: user._id }],
          });
        else {
          ticket.messages.push({
            role: "user",
            content: message,
            sender: user._id,
          });
          await ticket.save();
        }

        socket.join(ticket._id.toString());

        socket.emit("ticketCreated", ticket);

        // notify support team
        io.to("supportTeam").emit("newTicket", ticket);

        console.log("🎟️ New ticket created:", ticket._id);
      })
    );

    socket.on(
      "replyTicket",
      asyncHandler(async (data) => {
        const { userId, ticketId, content } = data;

        if (!userId || !ticketId || !content) {
          return socket.emit("error", "Missing required fields");
        }
        const user = await User.findById(userId);

        console.log("user", user);

        if (!user) return socket.emit("error", "User not found");

        const role =
          user.role === "admin" || user.role === "manager" ? "support" : "user";
        if (role !== "support")
          return socket.emit("error", "Not authorized , should be support");

        const ticket = await Chat.findById(ticketId);
        console.log("ticket", ticket);

        if (!ticket) return socket.emit("error", "Chat not found");

        const newMessage = { role, content, sender: user._id };
        ticket.messages.push(newMessage);

        if (role === "support" && ticket.status === "open") {
          ticket.status = "in-progress";
        }

        await ticket.save();

        io.to(ticket._id.toString()).emit("ticketUpdated", ticket);
      })
    );

    socket.on(
      "closeTicket",
      asyncHandler(async ({ ticketId }) => {
        // const user = await User.findById(userId);
        // if (!user || (user.role !== "admin" && user.role !== "manager")) {
        //   return socket.emit("error", "Not authorized");
        // }

        const ticket = await Chat.findById(ticketId);
        if (!ticket) return socket.emit("error", "Chat not found");

        ticket.status = "closed";
        await ticket.save();

        io.to(ticket._id.toString()).emit("ticketUpdated", ticket);
      })
    );

    socket.on("joinSupport", ({ userId }) => {
      User.findById(userId).then((user) => {
        if (user && (user.role === "admin" || user.role === "manager")) {
          socket.join("supportTeam");
          socket.emit("joinedSupportTeam", user.name);
          console.log(`👨‍💼 Admin joined support team: ${userId}`);
        } else {
          socket.emit("error", "Not authorized for support");
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}

module.exports = socketHandler;
