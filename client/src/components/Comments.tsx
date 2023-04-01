import { FormEvent, useEffect, useRef, useState } from "react";
import { trpc } from "../client";

type CommentType = {
  id: number;
  content: string;
  user: {
    id: number;
    name: string;
  };
  userId: number;
};

function Comments() {
  const [incomingComments, setIncomingComments] = useState<CommentType[]>([]);

  const chatEl = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEl.current?.scrollTo({
      top: chatEl.current.scrollHeight,
      behavior: "smooth",
    });
  };

  const commenterName = trpc.commenterName.useQuery();
  const commenterNameMutation = trpc.setCommenterName.useMutation();
  const commentSubmitMutation = trpc.submitComment.useMutation();
  const commentInfiniteQuery = trpc.comments.useInfiniteQuery(
    {
      limit: 20,
    },
    {
      getNextPageParam: (lastpage) => lastpage.nextCursor,
      initialCursor: 0,
      onSettled: (data) => setTimeout(() => scrollToBottom(), 100),
    }
  );

  const [disabledSubmit, setDisabledSubmit] = useState(false);
  const [viewCount, setViewCount] = useState(0);

  const viewCountQuery = trpc.viewCount.useQuery();

  useEffect(() => {
    if (viewCountQuery?.data) setViewCount(viewCountQuery.data);
  }, [viewCountQuery.data]);

  trpc.viewCountEmitter.useSubscription(undefined, {
    onData: (data) => {
      setViewCount(data);
    },
  });

  trpc.commentEmitter.useSubscription(undefined, {
    onData: (data) => {
      setIncomingComments((prev) => [
        ...prev,
        {
          content: data.text,
          id: data.id,
          userId: data.user.id,
          user: data.user,
        },
      ]);
    },
  });

  const comments = [
    ...(commentInfiniteQuery.data?.pages
      .map((page) => page.items)
      .flat()
      .reverse() ?? []),
    ...incomingComments,
  ];

  if (
    comments.map((comment) => comment.id).length !==
    new Set(comments.map((comment) => comment.id)).size
  )
    setIncomingComments([]);

  useEffect(() => void scrollToBottom(), [incomingComments]);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = await commenterNameMutation.mutateAsync({
      name: (e.target as any)[0].value,
    });
    if (data.ok) commenterName.refetch();
  };

  const sendComment = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = (e.target as any)[0].value;
    (e.target as any)[0].value = "";

    setDisabledSubmit(true);

    const data = await commentSubmitMutation.mutateAsync({
      text: content,
    });

    if (data.ok) {
      setTimeout(() => {
        setDisabledSubmit(false);
      }, 1000);
    }
  };
  if (!commenterName.data) return <div>Loading...</div>;

  return (
    <div className="flex h-[30rem] flex-col gap-3 p-5 lg:h-screen">
      <div className="flex h-full flex-1 flex-col rounded-xl bg-gray-100 p-3 text-center font-bold">
        {viewCount + 1} Zuschauer
      </div>
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-gray-100 p-3">
        <h1 className="text-center text-3xl font-bold">Livechat</h1>
        <div
          className="flex flex-1 items-end justify-center overflow-y-auto"
          ref={chatEl}
          onScroll={(e) => {
            if (
              (chatEl.current?.scrollTop ?? 100) < 20 &&
              !commentInfiniteQuery.isFetching
            ) {
              commentInfiniteQuery.fetchNextPage();
            }
          }}
        >
          {commenterName.data.ok ? (
            <div className="h-fit max-h-full w-full">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  content={comment.content}
                  myself={commenterName.data.result?.id === comment.userId}
                  name={comment.user.name}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <form
                className={`flex w-full max-w-sm flex-col gap-5`}
                onSubmit={login}
              >
                <h3 className="text-md text-center font-bold">
                  Du musst deinen Namen angeben, um zu chatten
                </h3>
                <input
                  minLength={3}
                  maxLength={20}
                  type="text"
                  className="flex-1 rounded border-2 border-black py-2 pl-3 focus:border-primary-500 focus:outline-none"
                  placeholder="Dein Name"
                />
                <button className="rounded bg-primary-500 px-4 py-2 font-bold text-white hover:bg-primary-700">
                  {commenterNameMutation.isLoading ? "Laden..." : "Los chatten"}
                </button>
              </form>
            </div>
          )}
        </div>
        <form
          className={`flex justify-between gap-5 pt-2 ${
            commenterName.data.ok ? "" : "pointer-events-none opacity-25"
          }`}
          onSubmit={sendComment}
        >
          <input
            minLength={1}
            maxLength={200}
            type="text"
            className="max-w-[calc(100%-5rem)] flex-1 rounded border-2 border-black py-2 pl-3 focus:border-primary-500 focus:outline-none"
            placeholder="Schreibe eine Nachricht..."
          />
          <button
            disabled={disabledSubmit}
            className="w-fit rounded bg-primary-500 px-4 py-2 font-bold text-white hover:bg-primary-700"
          >
            <img
              className="h-5 fill-white"
              src="/icons/paper-plane-light.svg"
              alt=""
            />
          </button>
        </form>
      </div>
    </div>
  );
}

const Comment = (props: { content: string; myself: boolean; name: string }) => {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 ${
        props.myself ? "justify-end" : ""
      }`}
    >
      <div
        className={`max-w-[60%] rounded  px-2 ${
          props.myself ? "bg-primary-300" : "bg-gray-300"
        }`}
      >
        <p className="font-bold">{props.name}</p>
        <p className="w-fit max-w-full overflow-hidden">{props.content}</p>
      </div>
    </div>
  );
};

export default Comments;
