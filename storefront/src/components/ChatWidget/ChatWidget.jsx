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

    const messagesEndRef = useRef(null);

    // Automatically scroll to the latest message.
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Restore an existing conversation.
    useEffect(() => {
        const savedToken = localStorage.getItem("chat_token");

        if (!savedToken) return;

        const restoreConversation = async () => {
            try {
                const response = await getChatConversation(savedToken);

                setConversation(response.data.conversation);

                setMessages(response.data.messages || []);

                setConversation((previous) => ({
                    ...previous,
                    token: savedToken,
                }));
            } catch (error) {
                console.error("Could not restore chat:", error);
                localStorage.removeItem("chat_token");
            }
        };

        restoreConversation();
    }, []);

    // Listen for incoming messages.
    useEffect(() => {
        if (!conversation?.token) return;

        const channelName = `chat.conversation.${conversation.token}`;

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

    // Start a new conversation.
    const startConversation = async (event) => {
        event.preventDefault();

        setLoading(true);

        try {
            const response = await createChatConversation(customer);

            const newConversation = {
                ...response.data,
            };

            setConversation(newConversation);

            localStorage.setItem(
                "chat_token",
                newConversation.token
            );

        } catch (error) {
            console.error("Conversation error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to start conversation."
            );
        } finally {
            setLoading(false);
        }
    };

    // Send a message.
    const handleSendMessage = async (event) => {
        event.preventDefault();

        if (!message.trim() || sending) return;

        const messageBody = message.trim();

        setSending(true);

        setMessage("");

        try {
            const response = await sendChatMessage(
                conversation.token,
                messageBody
            );

            // Add the message immediately.
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
                                <h3>MEGA STORE Support</h3>
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

                    {!conversation ? (

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
                                    setCustomer({
                                        ...customer,
                                        guest_name: event.target.value,
                                    })
                                }
                                required
                            />

                            <input
                                type="email"
                                placeholder="Email address (optional)"
                                value={customer.guest_email}
                                onChange={(event) =>
                                    setCustomer({
                                        ...customer,
                                        guest_email: event.target.value,
                                    })
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
                                        disabled={sending || !message.trim()}
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