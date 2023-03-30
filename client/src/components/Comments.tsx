import React, { FormEvent, useState } from "react";
import { trpc } from "../client";

function Comments() {
  const commenterName = trpc.commenterName.useQuery();
  const commenterNameMutation = trpc.setCommenterName.useMutation();
  const commentSubmitMutation = trpc.submitComment.useMutation();
  const comments = trpc.comments.useInfiniteQuery(
    {
      limit: 20,
    },
    {
      getNextPageParam: (lastpage) => lastpage.nextCursor,
    }
  );

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = await commenterNameMutation.mutateAsync({
      name: (e.target as any)[0].value,
    });
    if (data.ok) commenterName.refetch();
  };

  const sendComment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const content = (e.target as any)[0].value;
    (e.target as any)[0].value = "";

    const data = commentSubmitMutation.mutateAsync({
      text: content,
    });
  };

  if (!commenterName.data) return <div>Loading...</div>;

  return (
    <div className="h-[30rem] p-5 lg:h-screen">
      <div className="flex h-full flex-col rounded-xl bg-gray-100 p-3">
        <h1 className="text-center text-3xl font-bold">Livechat</h1>
        <div className="flex-1 overflow-y-auto">
          {commenterName.data?.ok ? (
            <div>
              {comments.data?.pages.map((page) => {
                return (
                  <div>
                    {page.items.map((comment) => (
                      <Comment
                        content={comment.content}
                        myself={
                          commenterName.data.result?.id === comment.userId
                        }
                      />
                    ))}
                  </div>
                );
              })}
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
                  min={3}
                  max={20}
                  type="text"
                  className="flex-1 rounded border-2 border-black py-2 pl-3 focus:border-primary-500 focus:outline-none"
                  placeholder="Dein Name"
                />
                <button className="rounded bg-primary-500 px-4 py-2 font-bold text-white hover:bg-primary-700">
                  {commenterName.isLoading ? "Laden..." : "Los chatten"}
                </button>
              </form>
              {/* <h2 className="text-2xl font-bold text-center">
                Du musst eingeloggt sein, um den Livechat zu nutzen.
              </h2> */}
            </div>
          )}
        </div>
        <form
          className={`flex justify-between gap-5 ${
            commenterName.data.ok ? "" : "pointer-events-none opacity-25"
          }`}
          onSubmit={sendComment}
        >
          <input
            type="text"
            className="flex-1 rounded border-2 border-black py-2 pl-3 focus:border-primary-500 focus:outline-none"
            placeholder="Schreibe eine Nachricht..."
          />
          <button className="rounded bg-primary-500 px-4 py-2 font-bold text-white hover:bg-primary-700">
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

const Comment = (props: { content: string; myself: boolean }) => {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3 ${
        props.myself ? "justify-end" : ""
      }`}
    >
      <div
        className={`flex flex-col items-center gap-2 rounded bg-gray-400 ${
          props.myself ? "text-right" : ""
        }`}
      >
        <p className="font-bold">Max Mustermann</p>
        <p className="text-sm">{props.content}</p>
      </div>
    </div>
  );
};

export default Comments;
