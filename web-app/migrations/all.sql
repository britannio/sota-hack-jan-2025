create table
  public.model (
    id bigint generated always as identity not null,
    version_number text null,
    score numeric null,
    project_id bigint null,
    constraint model_pkey primary key (id),
    constraint model_project_id_fkey foreign key (project_id) references project (id)
  ) tablespace pg_default;

create table
  public.model_evaluation (
    id bigint generated always as identity not null,
    model_id bigint null,
    project_id bigint null,
    synthetic_data_id bigint null,
    model_output text null,
    judge_critique_text text null,
    judge_pass boolean null,
    expert_critique_text text null,
    expert_pass boolean null,
    improved_output text null,
    judging boolean default false,
    constraint model_evaluation_pkey primary key (id),
    constraint model_evaluation_synthetic_data_model_project_unique unique (synthetic_data_id, model_id, project_id),
    constraint model_evaluation_model_id_fkey foreign key (model_id) references model (id),
    constraint model_evaluation_project_id_fkey foreign key (project_id) references project (id),
    constraint model_evaluation_synthetic_data_id_fkey foreign key (synthetic_data_id) references synthetic_data (id)
  ) tablespace pg_default;

create table
  public.project (
    id bigint generated always as identity not null,
    name text null,
    judge_prompt text null,
    model_taxonomy text null,
    constraint project_pkey primary key (id)
  ) tablespace pg_default;

create table
  public.synthetic_data (
    id bigint generated always as identity not null,
    project_id bigint null,
    data text null,
    constraint synthetic_data_pkey primary key (id),
    constraint synthetic_data_project_id_fkey foreign key (project_id) references project (id)
  ) tablespace pg_default;