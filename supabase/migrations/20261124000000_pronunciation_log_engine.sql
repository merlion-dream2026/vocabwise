-- Which engine scored the attempt (azure | whisper), how the recording ended and how long it was.
-- Whisper attempts are now logged too (no scores) → see how often the shared F0 Azure key is busy.
alter table pronunciation_log add column if not exists engine text;
alter table pronunciation_log add column if not exists stop_reason text;
alter table pronunciation_log add column if not exists dur_ms integer;
update pronunciation_log set engine = 'azure' where engine is null;
