import { useEffect } from "react";
import echo from "../../services/echo";

const ChatListener = ({ conversationToken }) => {

    useEffect(() => {
        if (!conversationToken) return;

        const channelName = `chat.conversation.${conversationToken}`;

        echo.channel(channelName)
            .listen(".message.sent", (event) => {
                console.log("New chat message:", event.message);
            });

        return () => {
            echo.leave(channelName);
        };

    }, [conversationToken]);

    return null;
};

export default ChatListener;