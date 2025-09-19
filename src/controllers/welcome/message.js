const Message = (req, res) => {
  res.status(200).json({ message: "Welcome to Stable World!" });
};
export default Message;
