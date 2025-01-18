-- Migrations will appear here as you chat with AI

create table project (
  id bigint primary key generated always as identity,
  name text,
  model_summary text,
  model_input_dimensions json,
  judge_prompt text
);

create table model (
  id bigint primary key generated always as identity,
  version_number text,
  score numeric
);

create table synthetic_data (
  id bigint primary key generated always as identity,
  project_id bigint references project (id),
  data text
);

create table model_output (
  id bigint primary key generated always as identity,
  model_id bigint references model (id),
  project_id bigint references project (id),
  synthetic_data_id bigint references synthetic_data (id),
  data text
);

create table judge_critique (
  model_output_id bigint references model_output (id),
  critique_text text,
  pass boolean
);

create table expert_critique (
  model_output_id bigint references model_output (id),
  critique_text text,
  pass boolean
);

alter table model
add column project_id bigint references project (id);