import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  buildPlaybackModel,
  createQuestionViewTracker,
  formatDurationMs,
  playbackSummaryCaption,
  resolveFrameWindow,
  sessionPlaybackState,
  type PlaybackAnswer,
  type PlaybackCameraFrame,
  type PlaybackQuestionOrder,
  type QuestionViewWindow,
} from "./session-playback.ts"

// Fixed clock so ISO strings are readable in assertions.
const base = Date.parse("2026-01-01T10:00:00.000Z")
const at = (offsetSec: number) => new Date(base + offsetSec * 1000).toISOString()

const order: PlaybackQuestionOrder[] = [
  { question_id: "q1", index: 0 },
  { question_id: "q2", index: 1 },
  { question_id: "q3", index: 2 },
  { question_id: "q4", index: 3 },
]

const answers: PlaybackAnswer[] = [
  { question_id: "q1", prompt: "Q1", response: "a", is_correct: true, points_awarded: 1, max_points: 1 },
  { question_id: "q4", prompt: "Q4", response: "b", is_correct: false, points_awarded: 0, max_points: 1 },
]

describe("resolveFrameWindow", () => {
  const windows: QuestionViewWindow[] = [
    { question_id: "q1", entered_at: at(0), left_at: at(60), answer_at_exit: null, answer_change_count: 0 },
    { question_id: "q4", entered_at: at(120), left_at: at(300), answer_at_exit: null, answer_change_count: 0 },
  ]

  it("resolves a frame inside Q4's window to Q4", () => {
    const w = resolveFrameWindow(windows, Date.parse(at(180)))
    assert.equal(w?.question_id, "q4")
  })

  it("resolves a frame between questions to null", () => {
    const w = resolveFrameWindow(windows, Date.parse(at(90)))
    assert.equal(w, null)
  })

  it("prefers the later window when a revisit overlaps a boundary", () => {
    const revisit: QuestionViewWindow[] = [
      { question_id: "q1", entered_at: at(0), left_at: at(100), answer_at_exit: null, answer_change_count: 0 },
      { question_id: "q4", entered_at: at(100), left_at: at(200), answer_at_exit: null, answer_change_count: 0 },
    ]
    const w = resolveFrameWindow(revisit, Date.parse(at(100)))
    assert.equal(w?.question_id, "q4")
  })
})

describe("buildPlaybackModel", () => {
  it("resolves each frame's active question, marking between-question frames null", () => {
    const windows: QuestionViewWindow[] = [
      { question_id: "q1", entered_at: at(0), left_at: at(60), answer_at_exit: { response: "a" }, answer_change_count: 1 },
      { question_id: "q4", entered_at: at(120), left_at: at(300), answer_at_exit: { response: "b" }, answer_change_count: 3 },
    ]
    const frames: PlaybackCameraFrame[] = [
      { id: "f1", created_at: at(30), url: "u1" },
      { id: "f2", created_at: at(90), url: "u2" }, // between q1 and q4
      { id: "f3", created_at: at(180), url: "u3" },
    ]

    const model = buildPlaybackModel({ frames, windows, answers, order })

    assert.equal(model.frames[0].questionId, "q1")
    assert.equal(model.frames[0].answerAtExit, "a")
    assert.equal(model.frames[1].questionId, null)
    assert.equal(model.frames[1].answerAtExit, null)
    assert.equal(model.frames[2].questionId, "q4")
    assert.equal(model.frames[2].answerAtExit, "b")
  })

  it("sums time and edits across revisits, and grades each segment", () => {
    const windows: QuestionViewWindow[] = [
      // q4 visited twice: 180s + 60s = 240s; edits 3 + 2 = 5
      { question_id: "q1", entered_at: at(0), left_at: at(60), answer_at_exit: null, answer_change_count: 1 },
      { question_id: "q4", entered_at: at(120), left_at: at(300), answer_at_exit: null, answer_change_count: 3 },
      { question_id: "q4", entered_at: at(400), left_at: at(460), answer_at_exit: null, answer_change_count: 2 },
    ]
    const frames: PlaybackCameraFrame[] = [
      { id: "f1", created_at: at(30), url: "u1" },
      { id: "f2", created_at: at(150), url: "u2" },
    ]

    const model = buildPlaybackModel({ frames, windows, answers, order })
    const q1 = model.segments.find((s) => s.questionId === "q1")
    const q4 = model.segments.find((s) => s.questionId === "q4")

    assert.equal(q1?.totalMs, 60_000)
    assert.equal(q4?.totalMs, 240_000)
    assert.equal(q4?.answerChangeCount, 5)
    assert.equal(q1?.bucket, "correct")
    assert.equal(q4?.bucket, "incorrect")
    // Ordered by question position; only visited questions appear.
    assert.deepEqual(
      model.segments.map((s) => s.questionId),
      ["q1", "q4"],
    )
    // firstFrameIndex points at the first frame resolved to that question.
    assert.equal(q1?.firstFrameIndex, 0)
    assert.equal(q4?.firstFrameIndex, 1)
  })
})

describe("sessionPlaybackState", () => {
  it("renders the player when a timeline and available camera frames exist", () => {
    assert.equal(
      sessionPlaybackState({ availability: "available", hasTimeline: true, hasCameraFrames: true }),
      "player",
    )
  })

  it("shows the purged state when media was deleted by retention", () => {
    assert.equal(
      sessionPlaybackState({ availability: "purged", hasTimeline: true, hasCameraFrames: false }),
      "purged",
    )
  })

  it("hides the card (legacy slider fallback) when there is no timing log", () => {
    assert.equal(
      sessionPlaybackState({ availability: "available", hasTimeline: false, hasCameraFrames: true }),
      "none",
    )
  })
})

describe("presentation helpers", () => {
  it("formats durations", () => {
    assert.equal(formatDurationMs(192_000), "3m 12s")
    assert.equal(formatDurationMs(8_000), "8s")
  })

  it("captions the question with the most time", () => {
    const model = buildPlaybackModel({
      frames: [],
      windows: [
        { question_id: "q1", entered_at: at(0), left_at: at(60), answer_at_exit: null, answer_change_count: 0 },
        { question_id: "q4", entered_at: at(120), left_at: at(312), answer_at_exit: null, answer_change_count: 0 },
      ],
      answers,
      order,
    })
    assert.equal(
      playbackSummaryCaption(model.segments),
      "Longest on Q4 (3m 12s), answered incorrectly.",
    )
  })
})

describe("createQuestionViewTracker", () => {
  it("emits a completed record with the summed edit count on leave", () => {
    const emitted: unknown[] = []
    const tracker = createQuestionViewTracker((r) => emitted.push(r))

    tracker.enter("q1", base)
    tracker.recordAnswerChange("q1")
    tracker.recordAnswerChange("q1")
    tracker.recordAnswerChange("q2") // ignored: not the active question
    tracker.leaveCurrent("final answer", base + 5000)

    assert.equal(emitted.length, 1)
    assert.deepEqual(emitted[0], {
      questionId: "q1",
      enteredAt: new Date(base).toISOString(),
      leftAt: new Date(base + 5000).toISOString(),
      answer: "final answer",
      answerChangeCount: 2,
    })
  })

  it("never propagates a telemetry failure (submission must not be blocked)", () => {
    const tracker = createQuestionViewTracker(() => {
      throw new Error("db write failed")
    })
    tracker.enter("q1", base)
    // Closing the window on submit must not throw even though the emit does.
    assert.doesNotThrow(() => tracker.leaveCurrent("answer", base + 1000))
  })

  it("does not double-emit if leaveCurrent is called again after leaving", () => {
    const emitted: unknown[] = []
    const tracker = createQuestionViewTracker((r) => emitted.push(r))
    tracker.enter("q1", base)
    tracker.leaveCurrent(null, base + 1000)
    tracker.leaveCurrent(null, base + 2000) // no active window → no-op
    assert.equal(emitted.length, 1)
  })
})
