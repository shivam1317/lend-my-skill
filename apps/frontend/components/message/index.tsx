import { Button, Group, Image } from "@mantine/core";
import { ReactNode } from "react";
import styles from "./message.module.scss";
type MessageType = "BASIC" | "CONFIRM_AND_CANCEL_PROMPT"

interface Props {
  username: string;
  content: ReactNode;
  profileURL: string;
  timestamp?: string;
  id: string;
  isAttachment?: boolean;
  type: MessageType;
  acceptHandler?: () => void;
  rejectHandler?: () => void;
  completed?: boolean;
}

export function Message(props: Props) {
  const { content, profileURL, username, timestamp, isAttachment, type,completed,acceptHandler,rejectHandler } =
    props;
  if (type === "BASIC")
    return (
      <div className={`${styles.messageContainerWrapper}`} data-key={props.id}>
        <div className={styles.container}>
          <div className={styles.userAvatar}>
            <Image
              src={profileURL}
              alt={`${username}'s Profile`}
              width={50}
              height={50}
              className={styles.avatar}
            />
          </div>
          <div className={styles.wrapper}>
            <div className={styles.userInfoAndTimestamp}>
              <span className={styles.username}>{username}</span>
              <span className={styles.timestamp}>{timestamp}</span>
            </div>
            <div className={styles.messageWrapper}>
              {isAttachment === false ? (
                <span className={styles.content}>{content}</span>
              ) : (
                content
              )}
            </div>
          </div>
        </div>
      </div>
    );
  return (
    <div className={`${styles.messageContainerWrapper}`} data-key={props.id}>
      <div className={styles.container}>
        <div className={styles.userAvatar}>
          <Image
            src={profileURL}
            alt={`${username}'s Profile`}
            width={50}
            height={50}
            className={styles.avatar}
          />
        </div>
        <div className={styles.wrapper}>
          <div className={styles.userInfoAndTimestamp}>
            <span className={styles.username}>{username}</span>
            <span className={styles.timestamp}>{timestamp}</span>
          </div>
          <div className={styles.messageWrapper}>
            {isAttachment === false ? (
              <span className={styles.content}>{content}</span>
            ) : (
              content
            )}
            <Group position="left" className="ml-2 mt-3">
              <Button
                variant="outline"
                radius={"md"}
                onClick={acceptHandler}
                disabled={completed}
              >
                <span className={styles.accept}>Yes</span>
              </Button>
              <Button
                variant="outline"
                radius={"md"}
                onClick={rejectHandler}
                disabled={completed}
              >
                <span className={styles.reject}>No</span>
              </Button>
            </Group>
          </div>
        </div>
      </div>
    </div>
  );
}
