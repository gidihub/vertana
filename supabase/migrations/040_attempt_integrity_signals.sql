-- Richer proctoring integrity signals captured during the attempt, surfaced in
-- the candidate report. All nullable / zero-default so existing attempts and
-- non-proctored tests are unaffected.
--
--   user_agent       raw UA string (device + browser parsed for display)
--   fullscreen_exits number of times the candidate left full-screen
--   mouse_out_count  times the pointer left the assessment window
--   time_outside_ms  total ms the assessment window was hidden/blurred
--   resume_count     times the attempt was resumed (0 => completed in one sitting)
--   dual_screen      best-effort multi-monitor detection (null when unknown)

alter table attempts
  add column if not exists user_agent text,
  add column if not exists fullscreen_exits int not null default 0,
  add column if not exists mouse_out_count int not null default 0,
  add column if not exists time_outside_ms bigint not null default 0,
  add column if not exists resume_count int not null default 0,
  add column if not exists dual_screen boolean;
