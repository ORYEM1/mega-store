import { useEffect, useRef, useState } from "react";

import {
    FaComments,
    FaTimes,
    FaPaperPlane,
    FaHeadset,
} from "react-icons/fa";

import {
    createChatConversation,
    getChatConversation,
    sendChatMessage,
} from "../../services/api";

import echo from "../../services/echo";

import "./ChatWidget.css";

const CHAT_TOKEN_KEY = "chat_token";

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);

    const [conversation, setConversation] = useState(null);

    const [customer, setCustomer] = useState({
        guest_name: "",
        guest_email: "",
    });

    const [message, setMessage] = useState("");

    const [messages, setMessages] = useState([]);

    const [loading, setLoading] = useState(false);

    const [sending, setSending] = useState(false);

    const [restoring, setRestoring] = useState(true);

    const messagesEndRef = useRef(null);

    // Scroll to the latest message.
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Restore the customer's previous conversation.
    useEffect(() => {
        let active = true;

        const restoreConversation = async () => {
            const savedToken = localStorage.getItem(CHAT_TOKEN_KEY);

            if (!savedToken) {
                setRestoring(false);
                return;
            }

            try {
                const response = await getChatConversation(savedToken);

                if (!active) return;

                const savedConversation = response.data.conversation;

                setConversation({
                    ...savedConversation,
                    token: savedToken,
                });

                setCustomer({
                    guest_name: savedConversation.guest_name || "",
                    guest_email: savedConversation.guest_email || "",
                });

                setMessages(response.data.messages || []);

            } catch (error) {
                console.error("Could not restore chat:", error);

                // Only remove the token if the server confirms
                // that the conversation does not exist.
                if (error.response?.status === 404) {
                    localStorage.removeItem(CHAT_TOKEN_KEY);
                }

            } finally {
                if (active) {
                    setRestoring(false);
                }
            }
        };

        restoreConversation();

        return () => {
            active = false;
        };
    }, []);

    // Listen for new messages belonging to this conversation only.
    useEffect(() => {
        if (!conversation?.token) return;

        const channelName =
            `chat.conversation.${conversation.token}`;

        echo.channel(channelName)
            .listen(".message.sent", (event) => {
                setMessages((previous) => {
                    const exists = previous.some(
                        (item) => item.id === event.message.id
                    );

                    if (exists) return previous;

                    return [...previous, event.message];
                });
            });

        return () => {
            echo.leave(channelName);
        };
    }, [conversation?.token]);

    // Create or resume the customer's conversation.
    const startConversation = async (event) => {
        event.preventDefault();

        if (loading) return;

        setLoading(true);

        try {
            const savedToken = localStorage.getItem(CHAT_TOKEN_KEY);

            const response = await createChatConversation({
                ...customer,
                token: savedToken || undefined,
            });

            const conversationData = response.data;

            const newConversation = {
                ...conversationData,
                token: conversationData.token,
            };

            setConversation(newConversation);

            setCustomer({
                guest_name: conversationData.guest_name || customer.guest_name,
                guest_email: conversationData.guest_email || customer.guest_email,
            });

            localStorage.setItem(
                CHAT_TOKEN_KEY,
                conversationData.token
            );

            // Load previous messages when an existing conversation
            // has been resumed.
            const history = await getChatConversation(
                conversationData.token
            );

            setMessages(history.data.messages || []);

        } catch (error) {
            console.error("Conversation error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to start conversation. Please try again."
            );

        } finally {
            setLoading(false);
        }
    };

    // Send a message to the selected conversation.
    const handleSendMessage = async (event) => {
        event.preventDefault();

        if (!message.trim() || sending || !conversation?.token) {
            return;
        }

        const messageBody = message.trim();

        setSending(true);
        setMessage("");

        try {
            const response = await sendChatMessage(
                conversation.token,
                messageBody
            );

            setMessages((previous) => {
                const exists = previous.some(
                    (item) => item.id === response.data.id
                );

                if (exists) return previous;

                return [...previous, response.data];
            });

        } catch (error) {
            console.error("Message error:", error);

            setMessage(messageBody);

            alert(
                error.response?.data?.message ||
                "Message could not be sent."
            );

        } finally {
            setSending(false);
        }
    };

    return (
        <div className="chat-widget">

            {!isOpen && (
                <button
                    className="chat-toggle"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open customer support chat"
                >
                    <FaComments />
                    <span>Chat with us</span>
                </button>
            )}

            {isOpen && (
                <div className="chat-window">

                    <div className="chat-header">

                        <div className="chat-header-info">

                            <div className="chat-avatar">
                                <FaHeadset />
                            </div>

                            <div>
                                <h3>ADRIAN COLLECTIONS Support</h3>
                                <p>We're here to help you</p>
                            </div>

                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            <FaTimes />
                        </button>

                    </div>

                    {restoring ? (

                        <div className="chat-start-form">
                            <p>Restoring your conversation...</p>
                        </div>

                    ) : !conversation ? (

                        <form
                            className="chat-start-form"
                            onSubmit={startConversation}
                        >

                            <h3>Welcome to Adrian Collections!</h3>

                            <p>
                                Have a question about our products?
                                Start a conversation with us.
                            </p>

                            <input
                                type="text"
                                placeholder="Your name"
                                value={customer.guest_name}
                                onChange={(event) =>
                                    setCustomer((previous) => ({
                                        ...previous,
                                        guest_name: event.target.value,
                                    }))
                                }
                                required
                            />

                            <input
                                type="email"
                                placeholder="Email address (optional)"
                                value={customer.guest_email}
                                onChange={(event) =>
                                    setCustomer((previous) => ({
                                        ...previous,
                                        guest_email: event.target.value,
                                    }))
                                }
                            />

                            <button
                                type="submit"
                                disabled={loading}
                            >
                                {loading ? "Starting..." : "Start Chat"}
                            </button>

                        </form>

                    ) : (

                        <>
                            <div className="chat-messages">

                                <div className="chat-welcome">
                                    Welcome, {customer.guest_name || "Customer"}!
                                    How can we help you?
                                </div>

                                {messages.map((item) => (

                                    <div
                                        key={item.id}
                                        className={`chat-message ${
                                            item.sender_type === "customer"
                                                ? "customer-message"
                                                : "admin-message"
                                        }`}
                                    >
                                        {item.body}
                                    </div>

                                ))}

                                <div ref={messagesEndRef} />

                            </div>

                            {conversation.status === "open" ? (

                                <form
                                    className="chat-input-area"
                                    onSubmit={handleSendMessage}
                                >

                                    <input
                                        type="text"
                                        placeholder="Type your message..."
                                        value={message}
                                        onChange={(event) =>
                                            setMessage(event.target.value)
                                        }
                                    />

                                    <button
                                        type="submit"
                                        disabled={
                                            sending || !message.trim()
                                        }
                                    >
                                        <FaPaperPlane />
                                    </button>

                                </form>

                            ) : (

                                <div className="chat-closed">
                                    This conversation is closed.
                                </div>

                            )}
                        </>

                    )}

                </div>
            )}

        </div>
    );
};

export default ChatWidget;