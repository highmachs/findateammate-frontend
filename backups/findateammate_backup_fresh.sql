--
-- PostgreSQL database dump
--

\restrict 7WfEYsSsGhCYbLpynto8Hl2QRz5EIhe7cJf1pqjMVshuEx6KPOadVyTNXx5daIe

-- Dumped from database version 18.1 (Debian 18.1-1.pgdg12+2)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: findateammate_user
--

CREATE SCHEMA drizzle;


ALTER SCHEMA drizzle OWNER TO findateammate_user;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: findateammate_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO findateammate_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: findateammate_user
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


ALTER TABLE drizzle.__drizzle_migrations OWNER TO findateammate_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: findateammate_user
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNER TO findateammate_user;

--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: findateammate_user
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: analytics; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.analytics (
    id integer NOT NULL,
    user_id text,
    event text NOT NULL,
    page text NOT NULL,
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.analytics OWNER TO findateammate_user;

--
-- Name: analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: findateammate_user
--

CREATE SEQUENCE public.analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_id_seq OWNER TO findateammate_user;

--
-- Name: analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: findateammate_user
--

ALTER SEQUENCE public.analytics_id_seq OWNED BY public.analytics.id;


--
-- Name: chats; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.chats (
    id text NOT NULL,
    user1_id text NOT NULL,
    user1_name text NOT NULL,
    user2_id text NOT NULL,
    user2_name text NOT NULL,
    last_message text,
    last_message_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.chats OWNER TO findateammate_user;

--
-- Name: connection_requests; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.connection_requests (
    id text NOT NULL,
    post_id text NOT NULL,
    post_title text NOT NULL,
    from_user_id text NOT NULL,
    from_user_name text NOT NULL,
    from_user_skill text NOT NULL,
    to_user_id text NOT NULL,
    status text NOT NULL,
    message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    to_user_name text,
    from_user_last_cleared timestamp without time zone,
    to_user_last_cleared timestamp without time zone
);


ALTER TABLE public.connection_requests OWNER TO findateammate_user;

--
-- Name: error_logs; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.error_logs (
    id text NOT NULL,
    user_id text,
    username text,
    message text NOT NULL,
    stack text,
    source text NOT NULL,
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.error_logs OWNER TO findateammate_user;

--
-- Name: messages; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.messages (
    id text NOT NULL,
    chat_id text NOT NULL,
    sender_id text NOT NULL,
    text text NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.messages OWNER TO findateammate_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    link text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    metadata jsonb
);


ALTER TABLE public.notifications OWNER TO findateammate_user;

--
-- Name: posts; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.posts (
    id text NOT NULL,
    title text NOT NULL,
    skills_offered jsonb NOT NULL,
    skills_wanted jsonb NOT NULL,
    description text NOT NULL,
    availability text NOT NULL,
    city text NOT NULL,
    university text,
    event_name text,
    event_website text,
    event_details text,
    event_upvotes integer DEFAULT 0,
    user_id text NOT NULL,
    user_name text NOT NULL,
    user_skill text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    event_image text
);


ALTER TABLE public.posts OWNER TO findateammate_user;

--
-- Name: session; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO findateammate_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: findateammate_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    name text NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    skill text NOT NULL,
    bio text NOT NULL,
    portfolio text NOT NULL,
    github text NOT NULL,
    twitter text,
    linkedin text,
    university text,
    city text,
    privacy jsonb NOT NULL,
    password text NOT NULL,
    avatar text,
    is_admin boolean DEFAULT false NOT NULL,
    skill_level text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO findateammate_user;

--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: findateammate_user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: analytics id; Type: DEFAULT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.analytics ALTER COLUMN id SET DEFAULT nextval('public.analytics_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: findateammate_user
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
1	b801d9e66c50628306e6916454b21f923b25d2261efba66b3bab934282417fef	1770011415726
2	4a12ff16b450b898298400d0cf9bf49820c24056edcface4645ea8481fb28562	1770110153274
3	61afa67725ac5cdb03d40601b608acf4e6ac3ee8d988e71f419029a7b40cb72e	1770273849500
4	050f5c7b569d8dce61924b0fd2c9609c0b01846f20fcfa0e502e061d97d69a22	1770281926381
5	e9af1b81137086941b538907615293bbb27290f1ece4ae7d7d7a1b2d81732792	1770299106506
6	91c342133880f2493ccf79fae1541b33b91a367e9da15924b2e262454513db26	1770439618029
7	da52041e4435a2c5df9d038d57359117e92ae956fd9bacdeafef436fc752a771	1770799128204
8	3b1fbf34ceee75f5785811124945791a65948dab6e987a04ea3faa00ee8ecd5c	1770800321424
\.


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.analytics (id, user_id, event, page, metadata, "timestamp") FROM stdin;
1	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:52:24.835Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1366x768"}	2026-02-11 07:52:25.402047
2	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:54:11.820Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:54:13.608893
3	\N	hero_click_browse	/	{"timestamp": "2026-02-11T07:54:35.475Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:54:37.288701
4	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:55:28.441Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:55:30.234011
5	\N	banner_click_signup	/	{"timestamp": "2026-02-11T07:55:45.151Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:55:46.973444
6	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:55:45.194Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:55:47.060998
7	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:55:49.470Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:55:51.278617
8	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:55:53.497Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 (compatible; Google-Read-Aloud; +https://support.google.com/webmasters/answer/1061943)", "screenResolution": "400x400"}	2026-02-11 07:55:55.126634
9	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:57:16.883Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:57:18.691658
10	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:57:23.995Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:57:25.812569
11	\N	page_view_landing	/	{"timestamp": "2026-02-11T07:58:41.268Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 07:58:43.084859
12	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:00:15.724Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 08:00:15.507699
13	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:01:06.576Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-11 08:01:08.363469
14	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:04:50.178Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:04:50.572702
15	\N	banner_click_signup	/	{"timestamp": "2026-02-11T08:05:24.742Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:06:10.490757
16	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:06:12.947Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:12.333771
17	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:06:18.252Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:17.663007
18	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:06:19.491Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:18.832272
19	\N	hero_click_browse	/	{"timestamp": "2026-02-11T08:06:20.596Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:20.002451
20	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:06:20.617Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:20.021432
21	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:06:38.239Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:37.71888
22	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:06:45.174Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:44.533658
23	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:06:58.955Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:06:58.312324
24	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:07:02.183Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:07:01.505943
25	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:07:00.815Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:07:02.626777
26	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:07:11.627Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:07:12.440738
27	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:07:21.150Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:07:21.704295
28	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:07:36.845Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:07:37.310439
29	\N	hero_click_browse	/	{"timestamp": "2026-02-11T08:07:36.787Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:07:37.508155
30	\N	hero_click_browse	/	{"timestamp": "2026-02-11T08:07:38.508Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:07:40.672877
31	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:07:38.544Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:07:40.678558
32	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:08:11.341Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:08:12.424539
33	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:08:23.061Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:08:24.201705
34	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:10:30.212Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 08:10:29.733773
35	\N	page_view_landing	/	{"timestamp": "2026-02-11T08:11:18.962Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 08:11:20.10943
36	\N	page_view_landing	/	{"timestamp": "2026-02-11T09:16:09.241Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 09:16:08.810213
37	\N	page_view_landing	/	{"timestamp": "2026-02-11T09:26:35.648Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 09:26:29.950918
38	\N	page_view_landing	/	{"timestamp": "2026-02-11T09:28:07.048Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 09:28:06.811195
39	\N	page_view_landing	/	{"timestamp": "2026-02-11T09:37:15.095Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 09:37:14.576434
40	\N	page_view_landing	/	{"timestamp": "2026-02-11T09:37:57.805Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 09:37:57.378074
41	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:04.059Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:03.55543
42	\N	hero_click_browse	/	{"timestamp": "2026-02-11T10:00:09.561Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:09.070662
43	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:09.591Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:09.156609
44	\N	hero_click_browse	/	{"timestamp": "2026-02-11T10:00:16.723Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:16.235941
45	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:16.745Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:16.245498
46	\N	hero_click_browse	/	{"timestamp": "2026-02-11T10:00:19.991Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:19.496894
47	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:20.009Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:19.515206
48	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:28.664Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:28.152048
49	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:28.680Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:28.180699
50	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:34.228Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:33.73611
51	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:34.247Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:34.049449
52	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:37.352Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:36.842467
53	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:37.367Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:36.863463
54	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:39.666Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:39.180202
55	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:39.687Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:39.208266
56	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:40.642Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:40.133429
57	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:40.663Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:40.25066
58	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:40.941Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:40.440223
59	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:40.956Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:40.456798
60	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:43.334Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:42.835479
61	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:43.353Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:42.859325
62	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:51.391Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:50.877287
63	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:55.079Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:54.590441
64	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:55.111Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:54.604601
65	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:55.451Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:54.964111
66	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:55.474Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:54.964516
67	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:55.673Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:55.181482
68	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:55.695Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:55.197439
69	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:56.180Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:55.675798
70	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:56.205Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:55.6941
71	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:56.379Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:55.864505
72	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:56.399Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:55.897648
73	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:56.556Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.043421
74	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:56.577Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.149327
75	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:56.708Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.356135
76	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:56.733Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.461457
77	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:56.905Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.559332
78	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:56.882Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.567429
79	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:57.048Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.574829
80	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:57.079Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.758717
81	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:57.263Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.851701
82	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:57.234Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.852778
83	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:57.404Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:56.957758
84	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:57.423Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.058428
85	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:57.590Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.101718
86	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:57.610Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.148314
87	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:57.771Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.263427
88	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:57.791Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.282795
89	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:57.953Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.452432
90	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:57.976Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.523551
92	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:58.123Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.700792
93	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:58.288Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.792634
98	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:58.666Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.157465
99	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:58.821Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.305718
100	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:58.842Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.348515
109	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:59.730Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.216429
110	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:59.751Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.247282
111	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:59.905Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.397932
112	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:59.924Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.421638
113	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:00.105Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.597344
114	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:00.125Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.634353
115	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:00.284Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.775886
116	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:00.313Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.798656
117	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:00.473Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.972862
118	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:00.492Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.049304
119	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:00.659Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.140213
120	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:00.679Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.172765
121	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:00.808Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.295276
122	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:00.830Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.319673
123	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:01.000Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.49471
124	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:01.019Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.524773
125	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:01.180Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.676442
126	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:01.200Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.699757
127	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:01.368Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.868435
128	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:01.387Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:00.896438
131	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:01.680Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.173862
132	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:01.699Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.193434
134	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:01.866Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.373732
91	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:58.105Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.615751
94	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:58.307Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.797043
95	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:58.467Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.960839
96	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:58.496Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:57.99444
97	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:58.647Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.147441
101	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:59.000Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.486807
102	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:59.018Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.511678
103	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:59.166Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.648943
104	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:59.186Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.680579
105	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:59.359Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.846508
106	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:59.380Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:58.8675
107	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:00:59.548Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.050033
108	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:00:59.569Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:00:59.150028
129	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:01.514Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.00067
130	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:01.534Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.038456
133	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:01.847Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.34289
139	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.294Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.860447
141	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.413Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.960428
144	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.570Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.076602
150	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.928Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.463823
151	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.042Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.562921
154	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.177Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.667315
155	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.283Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.819395
157	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.422Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.960661
175	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.558Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.051444
176	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.577Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.068921
177	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.680Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.171538
178	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.700Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.249427
180	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.826Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.449461
135	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.046Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.546575
136	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.066Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.567428
137	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.166Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.665329
138	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.195Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.858277
142	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.432Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.962515
143	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.544Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.055252
145	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.663Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.155969
146	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.683Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.17927
147	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.785Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.294882
152	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.062Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.566489
153	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.158Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.662432
156	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.303Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.821727
140	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.317Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:01.864437
148	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:02.805Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.347849
149	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:02.908Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.462732
158	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.446Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:02.963474
159	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.548Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.050567
160	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.569Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.069893
161	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.686Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.190471
162	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.711Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.210462
163	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.804Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.295989
164	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.826Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.346532
165	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:03.935Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.42043
166	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:03.955Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.449515
167	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.049Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.542688
168	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.069Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.571433
169	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.182Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.689762
170	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.204Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.703217
171	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.308Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.797688
172	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.327Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.819659
173	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.430Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.916127
174	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.449Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:03.940445
179	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.805Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.447476
182	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:05.075Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.647605
181	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:05.056Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.556875
183	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:04.939Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.647441
184	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:04.959Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.652275
185	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:05.174Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.749684
186	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:05.192Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.754401
187	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:05.306Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.851951
188	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:05.326Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.852713
189	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:05.433Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.94347
190	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:05.455Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:04.952775
191	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:05.589Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:05.090169
192	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:05.616Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:05.158862
193	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:01:05.711Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:05.247879
194	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:01:05.732Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:01:05.252921
195	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:21:41.589Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 10:21:41.4553
196	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:22:01.507Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 10:22:00.871275
197	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:22:04.360Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 10:22:03.737247
198	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:26:50.373Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:26:50.401159
199	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:26:59.338Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:26:58.930593
200	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:26:59.355Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:26:58.934551
201	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:27:02.320Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:27:01.867726
202	\N	hero_click_browse	/	{"timestamp": "2026-02-11T10:27:02.309Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:27:01.876444
203	\N	banner_click_signup	/	{"timestamp": "2026-02-11T10:27:08.179Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:27:07.217295
204	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:27:08.188Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-11 10:27:07.218685
205	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:34:37.743Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 10:34:38.236427
206	\N	page_view_landing	/	{"timestamp": "2026-02-11T10:36:27.424Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 10:36:27.985174
207	\N	page_view_landing	/	{"timestamp": "2026-02-11T11:06:08.316Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 11:06:46.277986
208	\N	page_view_landing	/	{"timestamp": "2026-02-11T11:06:45.996Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 11:06:47.418924
209	\N	page_view_landing	/	{"timestamp": "2026-02-11T11:14:13.307Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 11:14:13.762193
210	\N	page_view_landing	/	{"timestamp": "2026-02-11T11:35:38.998Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 11:35:38.816021
211	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:20:16.000Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 16:20:16.076935
212	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:20:24.753Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "360x792"}	2026-02-11 16:20:24.132784
213	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:20:32.640Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 16:20:32.055299
214	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:25:28.522Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 16:25:27.937507
215	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:29:04.445Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:29:04.300476
216	\N	hero_click_browse	/	{"timestamp": "2026-02-11T16:29:52.217Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:29:52.239753
217	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:31:14.355Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-11 16:31:14.059114
218	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:31:22.319Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:31:22.260272
219	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:31:45.667Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:31:45.566737
220	\N	hero_click_browse	/	{"timestamp": "2026-02-11T16:31:48.774Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:31:48.645102
221	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:31:48.797Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:31:48.804689
222	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:31:52.258Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:31:52.2021
223	\N	hero_click_browse	/	{"timestamp": "2026-02-11T16:31:52.239Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:31:52.408052
224	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:32:17.558Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:17.840179
225	\N	banner_click_signup	/	{"timestamp": "2026-02-11T16:32:34.893Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:34.899972
226	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:32:34.934Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:34.927557
227	\N	banner_click_signup	/	{"timestamp": "2026-02-11T16:32:39.896Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:39.870465
228	\N	banner_click_signup	/	{"timestamp": "2026-02-11T16:32:39.137Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:39.927295
229	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:32:39.167Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:39.961807
230	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:32:39.931Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:40.022933
231	\N	banner_click_signup	/	{"timestamp": "2026-02-11T16:32:40.090Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:40.100715
232	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:32:40.322Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:40.184003
233	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:32:40.119Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:40.225956
234	\N	banner_click_signup	/	{"timestamp": "2026-02-11T16:32:40.302Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:40.304477
235	\N	banner_click_signup	/	{"timestamp": "2026-02-11T16:32:40.511Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:40.382113
236	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:32:40.536Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:32:40.716972
237	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:33:03.069Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:33:03.27732
238	\N	hero_click_browse	/	{"timestamp": "2026-02-11T16:33:05.020Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:33:04.885315
239	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:33:05.042Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-11 16:33:04.915369
240	\N	page_view_landing	/	{"timestamp": "2026-02-11T16:50:39.203Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 16:50:39.718499
241	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:26:27.768Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 17:26:28.184254
242	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:27:04.674Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 17:27:05.143429
243	\N	hero_click_browse	/	{"timestamp": "2026-02-11T17:27:08.487Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 17:27:08.888608
244	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:27:12.657Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 17:27:13.105442
245	\N	banner_click_signup	/	{"timestamp": "2026-02-11T17:27:21.131Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 17:27:21.54268
246	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:27:22.296Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-11 17:27:22.730868
247	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:29:58.319Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:30:00.231978
248	\N	hero_click_browse	/	{"timestamp": "2026-02-11T17:31:39.250Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:31:41.310779
249	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:31:42.662Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:31:44.593434
250	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:33:22.205Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:33:24.13661
251	\N	hero_click_browse	/	{"timestamp": "2026-02-11T17:33:30.011Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:33:32.006605
252	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:33:30.072Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:33:32.094378
253	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:33:57.872Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:33:59.81743
254	\N	hero_click_browse	/	{"timestamp": "2026-02-11T17:33:57.815Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:33:59.846682
255	\N	hero_click_browse	/	{"timestamp": "2026-02-11T17:33:59.736Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:34:01.724635
256	\N	page_view_landing	/	{"timestamp": "2026-02-11T17:33:59.780Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1680x1050"}	2026-02-11 17:34:01.727428
257	\N	page_view_landing	/	{"timestamp": "2026-02-12T00:10:16.793Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 00:10:17.741073
258	\N	page_view_landing	/	{"timestamp": "2026-02-12T00:11:32.401Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 00:11:33.32703
259	\N	page_view_landing	/	{"timestamp": "2026-02-12T00:51:04.215Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-12 00:51:04.056344
260	\N	page_view_landing	/	{"timestamp": "2026-02-12T00:51:05.709Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-12 00:51:05.01016
261	\N	page_view_landing	/	{"timestamp": "2026-02-12T00:53:03.450Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1366x768"}	2026-02-12 00:53:04.206115
262	\N	page_view_landing	/	{"timestamp": "2026-02-12T03:59:23.989Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1366x768"}	2026-02-12 04:00:18.004449
263	\N	page_view_landing	/	{"timestamp": "2026-02-12T04:33:28.932Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 04:33:29.838495
264	\N	page_view_landing	/	{"timestamp": "2026-02-12T04:33:38.697Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 04:33:39.549132
265	\N	page_view_landing	/	{"timestamp": "2026-02-12T04:35:14.090Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 04:35:14.60756
266	\N	banner_click_signup	/	{"timestamp": "2026-02-12T04:35:24.019Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 04:35:24.514796
267	\N	page_view_landing	/	{"timestamp": "2026-02-12T04:35:24.048Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 04:35:24.541438
268	\N	banner_click_signup	/	{"timestamp": "2026-02-12T04:35:35.166Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 04:35:35.675968
269	\N	page_view_landing	/	{"timestamp": "2026-02-12T04:35:35.184Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 04:35:35.67664
270	\N	page_view_landing	/	{"timestamp": "2026-02-12T04:35:39.111Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 04:35:39.641121
271	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:10:51.937Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "432x960"}	2026-02-12 05:10:53.573968
272	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:11:05.736Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 05:11:07.32126
273	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:11:15.066Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 05:11:16.688638
274	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:16:50.074Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:16:50.705056
275	\N	banner_click_signup	/	{"timestamp": "2026-02-12T05:17:15.891Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:16.555796
276	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:15.907Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:16.569701
277	\N	banner_click_signup	/	{"timestamp": "2026-02-12T05:17:20.586Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:21.305036
278	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:20.597Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:21.403288
279	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:26.189Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:27.043688
280	\N	banner_click_signup	/	{"timestamp": "2026-02-12T05:17:28.497Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:29.132464
281	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:30.711Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:31.340134
282	\N	banner_click_signup	/	{"timestamp": "2026-02-12T05:17:34.762Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:35.386444
283	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:39.007Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:39.636285
284	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:39.676Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:40.285687
285	\N	banner_click_signup	/	{"timestamp": "2026-02-12T05:17:43.090Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:43.714321
286	\N	banner_click_signup	/	{"timestamp": "2026-02-12T05:17:47.706Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:48.366849
287	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:47.720Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:48.374257
288	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:17:55.222Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:55.839556
289	\N	hero_click_browse	/	{"timestamp": "2026-02-12T05:17:58.993Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:17:59.620379
290	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:18:00.263Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:18:00.88338
291	\N	hero_click_browse	/	{"timestamp": "2026-02-12T05:18:04.601Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:18:05.330504
292	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:18:06.189Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:18:06.801092
293	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:18:08.805Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:18:09.428329
294	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:18:13.359Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:18:13.971096
295	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:27:36.844Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:27:37.481514
296	\N	page_view_landing	/	{"timestamp": "2026-02-12T05:27:57.256Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 05:27:57.912337
297	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:46:33.141Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 06:46:33.804785
298	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:41.368Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:42.977984
299	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:44.804Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:46.614505
300	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:44.840Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:46.735001
301	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:45.983Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:47.70666
302	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:46.025Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:47.711024
303	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:46.191Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:47.824143
304	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:46.227Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:47.924707
305	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:46.418Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:48.014431
306	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:46.373Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:48.014624
307	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:46.529Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:48.207494
308	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:46.551Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:48.228536
309	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:46.699Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:48.309878
310	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:46.671Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:48.311279
311	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:50.577Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:52.205435
312	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:50.608Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:52.220437
313	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:50.943Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:52.556429
314	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:50.987Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:52.572902
315	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:51.259Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:52.882694
316	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:51.306Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:52.999914
317	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:51.542Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.164246
318	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:51.602Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.209982
319	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:51.842Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.450566
320	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:51.804Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.456019
321	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:52.048Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.664666
322	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:52.100Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.690875
323	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:52.285Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.896317
324	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:52.321Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:53.904933
325	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:52.545Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:54.177963
326	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:52.592Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:54.180663
327	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:52.992Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:54.604159
328	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:53.034Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:54.623029
329	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:53.211Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:54.804869
330	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:53.258Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:54.855435
333	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:54.685Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.289663
334	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:54.645Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.32064
335	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:54.914Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.572081
342	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.300Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.002517
345	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.498Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.221452
349	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.741Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.508534
356	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.902Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:58.100147
331	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:54.012Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:55.633111
332	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:54.069Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:55.697983
338	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.099Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.710238
339	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.193Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.816712
341	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.229Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.910124
343	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.370Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.116607
346	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.519Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.298732
350	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.720Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.599163
355	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.827Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.907706
336	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:54.882Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.585854
337	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.073Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.699873
340	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.164Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:56.909592
344	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.320Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.199348
347	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.394Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.498567
348	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.269Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.50024
351	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.652Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.711018
352	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.684Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.808792
353	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.953Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.809617
354	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.873Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:57.907009
357	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:56.070Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:58.115657
358	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:55.804Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:58.203025
359	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:55.975Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:58.214058
360	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:56.230Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:58.325745
361	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:56.092Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:58.326195
362	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:47:56.206Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:47:58.326658
363	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:47:59.168Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:00.771041
364	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:01.369Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:02.982834
365	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:01.406Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:03.017547
366	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:02.131Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:03.769148
367	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:02.188Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:03.803347
368	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:02.306Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:03.993173
369	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:02.330Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:04.004129
370	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:02.501Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:04.143943
371	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:02.528Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:04.14508
372	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:02.655Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:04.270431
373	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:02.678Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:04.279529
374	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:02.827Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:04.430098
375	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:02.801Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:04.435841
376	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:04.649Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:06.273602
377	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:04.617Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:06.282625
379	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:05.777Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:07.409673
380	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:11.083Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 (compatible; Google-Read-Aloud; +https://support.google.com/webmasters/answer/1061943)", "screenResolution": "400x400"}	2026-02-12 06:48:11.851443
378	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:05.730Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:07.398484
381	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:14.490Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:16.078437
382	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:19.764Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:21.413693
383	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:19.809Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:21.415483
384	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:34.476Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:36.07043
385	\N	hero_click_browse	/	{"timestamp": "2026-02-12T06:48:35.418Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:37.051635
386	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:48:36.180Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:37.794139
387	\N	banner_click_signup	/	{"timestamp": "2026-02-12T06:48:38.955Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 06:48:40.575281
388	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:56:01.357Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-12 06:56:02.401449
389	\N	page_view_landing	/	{"timestamp": "2026-02-12T06:58:53.093Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-12 06:58:54.135456
390	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:32:57.098Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:32:58.301362
391	\N	hero_click_browse	/	{"timestamp": "2026-02-12T07:33:11.906Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:33:12.766257
392	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:33:16.022Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "320x480"}	2026-02-12 07:33:16.226022
393	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:35:02.333Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:35:03.306512
394	\N	hero_click_browse	/	{"timestamp": "2026-02-12T07:35:08.624Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:35:09.361114
395	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:35:08.661Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:35:09.400223
396	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:35:11.539Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:35:12.29643
397	\N	hero_click_browse	/	{"timestamp": "2026-02-12T07:35:11.492Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:35:12.304346
398	\N	hero_click_browse	/	{"timestamp": "2026-02-12T07:35:12.733Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:35:13.485799
399	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:35:12.774Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 07:35:13.52448
400	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:38:39.207Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 07:38:39.936297
401	\N	page_view_landing	/	{"timestamp": "2026-02-12T07:48:00.555Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 07:48:01.573124
402	\N	page_view_landing	/	{"timestamp": "2026-02-12T08:26:33.825Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 08:26:34.43332
403	\N	page_view_landing	/	{"timestamp": "2026-02-12T08:53:53.733Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 08:53:54.336834
404	\N	page_view_landing	/	{"timestamp": "2026-02-12T08:54:00.079Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 08:54:00.69292
405	\N	banner_click_signup	/	{"timestamp": "2026-02-12T08:54:00.058Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 08:54:00.709375
406	\N	page_view_landing	/	{"timestamp": "2026-02-12T08:54:08.695Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 08:54:09.323981
407	\N	page_view_landing	/	{"timestamp": "2026-02-12T08:54:18.976Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-12 08:54:19.627346
408	\N	page_view_landing	/	{"timestamp": "2026-02-12T09:42:48.127Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 09:42:48.845901
409	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:03:53.029Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1536x864"}	2026-02-12 10:03:52.460475
410	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:05:30.420Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 10:05:33.77025
411	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:05:48.528Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "432x960"}	2026-02-12 10:06:03.126783
412	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:07:40.577Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 10:07:41.581827
413	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:07:52.353Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 10:07:53.202771
414	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:08:20.881Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 10:08:22.043478
415	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:11:09.748Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1536x864"}	2026-02-12 10:11:09.180514
416	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:11:14.165Z", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "432x960"}	2026-02-12 10:11:16.385533
417	\N	page_view_landing	/	{"timestamp": "2026-02-12T10:33:20.016Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-12 10:33:20.705742
418	\N	page_view_landing	/	{"timestamp": "2026-02-12T11:00:27.401Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36", "screenResolution": "384x832"}	2026-02-12 11:02:04.608394
419	\N	page_view_landing	/	{"timestamp": "2026-02-12T14:19:02.182Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 14:19:02.302037
420	\N	page_view_landing	/	{"timestamp": "2026-02-12T14:22:07.241Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 14:22:07.608508
421	\N	page_view_landing	/	{"timestamp": "2026-02-12T14:24:09.056Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1280x800"}	2026-02-12 14:24:09.460727
422	\N	page_view_landing	/	{"timestamp": "2026-02-12T14:27:08.800Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36 Edg/144.0.0.0", "screenResolution": "1280x800"}	2026-02-12 14:27:08.961568
423	\N	page_view_landing	/	{"timestamp": "2026-02-12T14:29:44.320Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 14:29:44.437473
424	\N	page_view_landing	/	{"timestamp": "2026-02-12T14:29:49.746Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-12 14:29:49.999961
425	\N	page_view_landing	/	{"timestamp": "2026-02-12T15:11:28.224Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 15:11:29.242433
426	\N	hero_click_browse	/	{"timestamp": "2026-02-12T15:11:36.044Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 15:11:37.025343
427	\N	page_view_landing	/	{"timestamp": "2026-02-12T15:11:39.350Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "393x895"}	2026-02-12 15:11:40.344449
428	\N	page_view_landing	/	{"timestamp": "2026-02-13T02:00:56.452Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x800"}	2026-02-13 02:00:58.015144
429	\N	page_view_landing	/	{"timestamp": "2026-02-13T05:06:36.888Z", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36", "screenResolution": "360x792"}	2026-02-13 05:06:36.290475
430	\N	page_view_landing	/	{"timestamp": "2026-02-13T05:13:08.771Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-13 05:13:08.43626
431	\N	page_view_landing	/	{"timestamp": "2026-02-13T07:00:15.275Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-13 07:00:14.953701
432	\N	page_view_landing	/	{"timestamp": "2026-02-13T07:57:15.359Z", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36", "screenResolution": "1920x1080"}	2026-02-13 08:01:41.119624
\.


--
-- Data for Name: chats; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.chats (id, user1_id, user1_name, user2_id, user2_name, last_message, last_message_at, created_at) FROM stdin;
\.


--
-- Data for Name: connection_requests; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.connection_requests (id, post_id, post_title, from_user_id, from_user_name, from_user_skill, to_user_id, status, message, created_at, to_user_name, from_user_last_cleared, to_user_last_cleared) FROM stdin;
Hh6pvtvjPFLK9FJzAaSc1	-HZZLNxPKN4ln8LfxdyPq	smart india hackathon	GQOEIQ2s8amiuOHJlhsiA	test	react	lvnyXDwD06BFL6LVyFbdp	rejected	can i join?	2026-02-12 14:29:58.888442	Raghul R C	\N	\N
\.


--
-- Data for Name: error_logs; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.error_logs (id, user_id, username, message, stack, source, metadata, "timestamp") FROM stdin;
QBUt3xTm8MQeG2Ay_oVOJ	ALLgyODw7U3QjwbuJo74q	World Admin	Failed to fetch audit logs API route not found	Error: API route not found\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async fetchAuditLogs (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:2820)\n    at async queryFn (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:16271)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/admin", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 06:46:40.583185
XSU1KP-sOFoXQdHCT2TsG	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 06:46:42.20721
hQAuHZiltLMsVDbN2yLkH	\N	\N	Rejected	Error: Rejected\n    at wrsParams.serviceWorkers.navigator.serviceWorker.register (<anonymous>:13:684)\n    at https://findateammate-rpqh.onrender.com/registerSW.js:1:98	frontend-promise	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36 (compatible; Google-Read-Aloud; +https://support.google.com/webmasters/answer/1061943)"}	2026-02-12 06:48:11.811793
GsuKApdo6ZqYqgEfa1Q-w	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 06:52:32.602791
W4aeSvk5HwGba8QrtLopv	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 06:52:40.650193
0DozH3hBWWlQA4FFQuzjZ	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 06:52:57.768644
4-Tin2sDoWJ6EuDg-cbVK	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 06:55:03.007683
naA5c5_XiYBbNC-4BU-pe	ALLgyODw7U3QjwbuJo74q	World Admin	Failed to fetch audit logs API route not found	Error: API route not found\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async fetchAuditLogs (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:2820)\n    at async queryFn (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:16271)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/admin", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 06:55:03.445325
v2Cs-m5yscJAnWqaqPYWy	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 06:58:05.8009
s9ByiIou9ObuAbTKNARD-	\N	\N	Rejected	Error: Rejected\n    at ServiceWorkerContainer.<anonymous> (<anonymous>:664:449)\n    at ServiceWorkerContainer.register (<anonymous>:455:197)\n    at https://findateammate-rpqh.onrender.com/registerSW.js:1:98	frontend-promise	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36"}	2026-02-12 07:33:16.298344
JH3c3f56XdFLSsNX8WoAI	XIWQd4YwAScs7yK39aLN4	Urvi	Failed to update profile [\n  {\n    "expected": "date",\n    "code": "invalid_type",\n    "path": [\n      "createdAt"\n    ],\n    "message": "Invalid input: expected date, received string"\n  }\n]	Error: [\n  {\n    "expected": "date",\n    "code": "invalid_type",\n    "path": [\n      "createdAt"\n    ],\n    "message": "Invalid input: expected date, received string"\n  }\n]\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async updateProfile (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:96905)\n    at async m (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:64:36261)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/profile", "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36"}	2026-02-12 07:38:28.773998
FDramLFj8QiHMi0VKLd4R	lvnyXDwD06BFL6LVyFbdp	Raghul R C	[GlobalListener] Socket connection error: xhr poll error	Error: xhr poll error\n    at vee.onError (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:10952)\n    at Zo.<anonymous> (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:13586)\n    at Qr.emit (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:9223)\n    at Zo._onError (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:15088)\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:14855	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/create-post", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 07:54:39.669442
KLkf1GxeB-RNlg3tYoDOX	lvnyXDwD06BFL6LVyFbdp	Raghul R C	Failed to fetch notifications: Failed to fetch	TypeError: Failed to fetch\n    at et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72984)\n    at fetchNotifications (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:98001)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/create-post", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 07:54:39.674484
11qkyxRWSWEnnVeNhKPkY	lvnyXDwD06BFL6LVyFbdp	Raghul R C	Failed to fetch notifications: Failed to fetch	TypeError: Failed to fetch\n    at et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72984)\n    at fetchNotifications (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:98001)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 10:42:26.17515
bnvgdnQhkN9frT_N7dedO	lvnyXDwD06BFL6LVyFbdp	Raghul R C	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 10:42:26.18321
xd8gexqim7tx_O9BAvxLt	GQOEIQ2s8amiuOHJlhsiA	test	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/chat", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 13:32:29.05943
fakYjQMS4BWCDzF8ddGCd	GQOEIQ2s8amiuOHJlhsiA	test	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/chat", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 13:32:29.265939
plKK3yL6nnM4FMnzX_aH7	GQOEIQ2s8amiuOHJlhsiA	test	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/chat", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 13:32:29.268248
CNT1oM8p4i9eLTyWT_eGy	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 14:24:44.90582
sjfgbXUfuUD4SUdQcpG4_	ALLgyODw7U3QjwbuJo74q	World Admin	Failed to fetch audit logs API route not found	Error: API route not found\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async fetchAuditLogs (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:2820)\n    at async queryFn (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:16271)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/admin", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 14:24:50.759297
EoBSQYAPJP9uiQInuhrQS	\N	\N	Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: 	Error: Failed query: \n        SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') as date, COUNT(*) as count \n        FROM "users" \n        WHERE "createdAt" > NOW() - INTERVAL '30 days'\n        GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD') \n        ORDER BY date ASC\n      \nparams: \n    at FT.queryWithCache (/app/dist/index.cjs:58:37220)\n    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)\n    at async /app/dist/index.cjs:145:976	backend-exception	{"path": "/api/admin/analytics", "method": "GET", "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-12 14:24:50.859436
YgxX8haVnUTdUmI3uRb6K	GQOEIQ2s8amiuOHJlhsiA	test	Forbidden: Only the receiver can reject request	Error: Forbidden: Only the receiver can reject request\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async disconnectRequest (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:95801)	frontend-promise	{"url": "https://findateammate-rpqh.onrender.com/requests", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 14:34:27.854867
RMPdvmSCc8IsNadBE_pgI	GQOEIQ2s8amiuOHJlhsiA	test	Failed to disconnect: Forbidden: Only the receiver can reject request	Error: Forbidden: Only the receiver can reject request\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async disconnectRequest (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:95801)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/requests", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 14:34:27.858931
s_TwQ1qJKb6wrqJAxT3l3	GQOEIQ2s8amiuOHJlhsiA	test	Forbidden: Only the receiver can reject request	Error: Forbidden: Only the receiver can reject request\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async disconnectRequest (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:95801)	frontend-promise	{"url": "https://findateammate-rpqh.onrender.com/requests", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 14:34:28.264841
wQO9Jlif_GXXgF4n8pD6f	GQOEIQ2s8amiuOHJlhsiA	test	Failed to disconnect: Forbidden: Only the receiver can reject request	Error: Forbidden: Only the receiver can reject request\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async disconnectRequest (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:95801)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/requests", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-12 14:34:28.26248
nPJ8w-fOSmJiwOb5Zty5I	ALLgyODw7U3QjwbuJo74q	World Admin	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/admin", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-13 03:54:06.184452
ePNoecajLGCG3S6hR3tky	ALLgyODw7U3QjwbuJo74q	World Admin	Failed to fetch audit logs API route not found	Error: API route not found\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async fetchAuditLogs (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:2820)\n    at async queryFn (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:102:16271)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/admin", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-13 05:01:32.690881
74joCdnk5VnKc1QEbBzAc	ALLgyODw7U3QjwbuJo74q	World Admin	Failed to update profile [\n  {\n    "expected": "date",\n    "code": "invalid_type",\n    "path": [\n      "createdAt"\n    ],\n    "message": "Invalid input: expected date, received string"\n  }\n]	Error: [\n  {\n    "expected": "date",\n    "code": "invalid_type",\n    "path": [\n      "createdAt"\n    ],\n    "message": "Invalid input: expected date, received string"\n  }\n]\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async updateProfile (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:96905)\n    at async m (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:64:36261)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/profile", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-13 06:50:51.336495
oT_tiirpeNVJnveR6I2Lq	ALLgyODw7U3QjwbuJo74q	World Admin	Failed to update profile [\n  {\n    "expected": "date",\n    "code": "invalid_type",\n    "path": [\n      "createdAt"\n    ],\n    "message": "Invalid input: expected date, received string"\n  }\n]	Error: [\n  {\n    "expected": "date",\n    "code": "invalid_type",\n    "path": [\n      "createdAt"\n    ],\n    "message": "Invalid input: expected date, received string"\n  }\n]\n    at f5 (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:72910)\n    at async et (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:73114)\n    at async updateProfile (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:10:96905)\n    at async m (https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:64:36261)	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/profile", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"}	2026-02-13 06:50:59.921991
EMIkop8KM4FHrhi9bqdr-	ALLgyODw7U3QjwbuJo74q	World Admin	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"}	2026-02-13 08:01:41.428137
U2aV_GSqkbYX7fGu4-o4m	ALLgyODw7U3QjwbuJo74q	World Admin	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"}	2026-02-13 08:01:41.808149
j0HEkT7rcH-Apzl1Urmf_	ALLgyODw7U3QjwbuJo74q	World Admin	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"}	2026-02-13 08:01:41.901442
hDoQtqGmAxSzx2OGqio1v	ALLgyODw7U3QjwbuJo74q	World Admin	[GlobalListener] Socket connection error: timeout	Error: timeout\n    at https://findateammate-rpqh.onrender.com/assets/index-phhibsIv.js:26:43421	frontend-console-error	{"url": "https://findateammate-rpqh.onrender.com/", "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36"}	2026-02-13 08:01:41.905588
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.messages (id, chat_id, sender_id, text, "timestamp") FROM stdin;
ToDtqB6Vki3a3jyYR5eh1	4Y1qLUCFp8bTvjV8NuLoc	GQOEIQ2s8amiuOHJlhsiA	did u check?	2026-02-12 00:10:56.343139
MLjXH8lMUfZYDHe2c1HKJ	4Y1qLUCFp8bTvjV8NuLoc	GQOEIQ2s8amiuOHJlhsiA	check is this working?	2026-02-12 04:34:36.002889
-CIQ_8gob79HZ2osde-HD	4Y1qLUCFp8bTvjV8NuLoc	lvnyXDwD06BFL6LVyFbdp	ok	2026-02-12 04:36:07.182776
MxwT20NfZdTSYtzLbVGE1	4Y1qLUCFp8bTvjV8NuLoc	GQOEIQ2s8amiuOHJlhsiA	wokring	2026-02-12 04:36:11.691982
zJKu6VYuBsocGDwyRU7r8	4Y1qLUCFp8bTvjV8NuLoc	lvnyXDwD06BFL6LVyFbdp	f you	2026-02-12 04:36:21.606711
_xrhxjwAIW0SwKt1NcNrs	4Y1qLUCFp8bTvjV8NuLoc	GQOEIQ2s8amiuOHJlhsiA	smd	2026-02-12 04:36:24.776269
4_VohWIty7kU5O8G_P9v_	4Y1qLUCFp8bTvjV8NuLoc	lvnyXDwD06BFL6LVyFbdp	b chod	2026-02-12 04:36:33.877698
a_oEAY5D-DLqJ3UHao3mx	4Y1qLUCFp8bTvjV8NuLoc	GQOEIQ2s8amiuOHJlhsiA	bkl	2026-02-12 04:36:38.147904
uLNIiQ2XPV9kCvfdbP5hl	Hh6pvtvjPFLK9FJzAaSc1	lvnyXDwD06BFL6LVyFbdp	hi	2026-02-12 14:33:59.18963
rB_n5vmLqPVfBVTzPAt6c	Hh6pvtvjPFLK9FJzAaSc1	lvnyXDwD06BFL6LVyFbdp	this shit is wokring	2026-02-12 14:34:03.541225
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.notifications (id, user_id, type, title, message, link, is_read, created_at, metadata) FROM stdin;
XBf-D1cvy-356mM1JIOuf	lvnyXDwD06BFL6LVyFbdp	connection_request	New Connection Request	test wants to connect with you regarding "smart india hackathon"	/requests	t	2026-02-12 14:29:58.890832	{"senderId": "GQOEIQ2s8amiuOHJlhsiA", "requestId": "Hh6pvtvjPFLK9FJzAaSc1"}
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.posts (id, title, skills_offered, skills_wanted, description, availability, city, university, event_name, event_website, event_details, event_upvotes, user_id, user_name, user_skill, created_at, event_image) FROM stdin;
-HZZLNxPKN4ln8LfxdyPq	smart india hackathon	[{"name": "react", "level": "Intermediate"}]	[{"name": "python", "level": "Intermediate"}]	looking for developers	Hackathon	remote	\N	\N	\N	\N	0	lvnyXDwD06BFL6LVyFbdp	Raghul R C	Python	2026-02-12 10:14:14.634739	\N
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.session (sid, sess, expire) FROM stdin;
diEfpSZaIrn--XmjmN0nIvCDQtK1AOSJ	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-16T05:06:35.945Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 259200000}, "userId": "lvnyXDwD06BFL6LVyFbdp"}	2026-02-16 05:09:47
vOWnzhRTKiKVnL-gzrF8rFXTXZglaAfI	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-13T10:11:15.457Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "lvnyXDwD06BFL6LVyFbdp"}	2026-02-13 10:43:17
TBpQWZO29vDfyVP6CXARvG3aWz7WGlnd	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-13T14:29:49.774Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "GQOEIQ2s8amiuOHJlhsiA"}	2026-02-13 15:35:05
UuMcunFE6G_TQ-IJDaZTCfs1m000Pjge	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-13T10:10:20.569Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "lvnyXDwD06BFL6LVyFbdp"}	2026-02-13 10:10:21
sETNZ8y7423pW257YtjJGUhFXgCsN92M	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-12T09:37:57.110Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "lvnyXDwD06BFL6LVyFbdp"}	2026-02-13 09:32:33
BUtv9iMlubLSQsG0FECn7_QOIaXmDGSa	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-13T10:11:08.756Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "lvnyXDwD06BFL6LVyFbdp"}	2026-02-13 10:22:40
DOg3fGvqlYV0CR0dzV7NIxOSvy7pHxWA	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-13T07:35:02.798Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "XIWQd4YwAScs7yK39aLN4"}	2026-02-13 15:34:42
7ltfoNpfGxA5beTn2d5pEr97IJOo70oN	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-13T14:27:08.553Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "lvnyXDwD06BFL6LVyFbdp"}	2026-02-13 16:13:51
aAip5BYucR4ASRgJciXrSIXSPLt5WDO8	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-13T14:22:07.256Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "ALLgyODw7U3QjwbuJo74q"}	2026-02-14 08:40:43
Itk7rNKCWhia2Od9mKS77z88dC8TdqhM	{"cookie": {"path": "/", "secure": true, "expires": "2026-02-14T02:00:57.652Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 86400000}, "userId": "xIgnogEDACg4GZWMtIqdQ"}	2026-02-14 02:02:54
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: findateammate_user
--

COPY public.users (id, name, username, email, skill, bio, portfolio, github, twitter, linkedin, university, city, privacy, password, avatar, is_admin, skill_level, created_at) FROM stdin;
GQOEIQ2s8amiuOHJlhsiA	test	test	test@test.com	react	testing the account and app			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$YKmnGlLF9rChIE8OJl500g$r7qmwXCBENWg4mqS41atd4TmeQkiMrcGoq9ZboQG7Ds	\N	f	\N	2026-02-12 05:52:43.806243
lvnyXDwD06BFL6LVyFbdp	Raghul R C	Ra_ghu_l	rcraghul12@gmail.com	Python	Bye bye bye bye bye bye bye bye			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$CHT4SG/WoWkqk+/9MYQoFA$yoUpeOs71EQ+MYuCV5MremNexkiZJAKMqpmXU7pL8v0	\N	f	\N	2026-02-12 05:52:43.806243
yvR3okuC8DWXZ3eR4flN4	Shivani Ananya	Shivz	kpshivaniananya@gmail.com	Frontend	Communicator and a frontend developer			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$0P7kghyYLIC/JCVoM93HSA$qbZ9+fl1Vzqrd9N9wbAySj+809QpkJn9CTgm0C1ppVg	\N	f	\N	2026-02-12 05:52:43.806243
Vs2bCK6MZWhYTZ4ljRdHa	B YUVAN SHANKAR	yuvan	yuvan162007@gmail.com	python	dkhfuwfjgkuwhbgrej;goerhethethhfbfbfbhrhrwh			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$z7jdwalfU9W8TYWowV/rlg$8ZdWpVgnH4/m6FjFxGUOi2tgobp8X6GaJN/ejYcbn00	\N	f	\N	2026-02-12 05:52:43.806243
XIWQd4YwAScs7yK39aLN4	Urvi	Urvu	urvipal106@gmail.com	Python	Hi samar okayyy 10 character			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$00CLl+SYibikS5YCclNDLQ$g+rBL8ad/JWFSfvIyBVIIym1z4FihdchSkY+O329TZc	\N	f	\N	2026-02-12 05:52:43.806243
BXs8EaGtIMFE53iTXfPPR	VIKASNI R	VIKASNI	vikasni.it.2001@gmail.com	typescript	currently I'm working on nothing. looking for a teammate			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$qjtaZURhp1K1oGhrpN7DTg$wyiqa9zNSXqyoUnA9NvmCfy6eNMNwbqO4/nCTyQwl6U	\N	f	\N	2026-02-12 05:52:43.806243
ALLgyODw7U3QjwbuJo74q	World Admin	worldadmin	lightyagami13@admin.com	Everything	System Superadmin	https://findateammate.com	https://github.com	\N	\N	Central System	Internal	{"showCity": true, "showEmail": true, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$wr4rYEKLgZMoeP/iRXK7+w$8kMAqTmMMpyRseF9R5sryKyZdHp2/en+i7DuTkoX48c	\N	t	\N	2026-02-12 05:52:43.806243
20Qp8S6t1M8LBbqY7N_MV	Gunal	gunal	gunalkrish8@gmail.com	ML , DL, AI	I’m a tech-enthusiast and a student who finds genuine joy in exploring data, understanding patterns, and learning how technology shapes our world.			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$VXjk2zfv4lceB8NHGyV49A$Cc9XXFXSccTbOV29YTjyZf3JCmud2SrVPfPnSVQ8Ong	\N	f	\N	2026-02-12 06:58:53.801444
xIgnogEDACg4GZWMtIqdQ	Harshadnarayana	Harshad	harshadnarayanas1@gmail.com	Python, ml, cyber	Hello im harshad			\N	\N	\N	\N	{"showCity": true, "showEmail": false, "showPortfolio": true, "showUniversity": true}	$argon2id$v=19$m=65536,t=3,p=4$6XwMZy+Tgx1cPL8ipJG6ug$IwMz8dvJrj1bFN+FtK2HD1xOl3VXOVEVonhQTsYhstE	\N	f	\N	2026-02-13 02:00:57.632797
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: findateammate_user
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 8, true);


--
-- Name: analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: findateammate_user
--

SELECT pg_catalog.setval('public.analytics_id_seq', 432, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: findateammate_user
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: chats chats_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.chats
    ADD CONSTRAINT chats_pkey PRIMARY KEY (id);


--
-- Name: connection_requests connection_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.connection_requests
    ADD CONSTRAINT connection_requests_pkey PRIMARY KEY (id);


--
-- Name: error_logs error_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: findateammate_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: chats_user1_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX chats_user1_idx ON public.chats USING btree (user1_id);


--
-- Name: chats_user2_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX chats_user2_idx ON public.chats USING btree (user2_id);


--
-- Name: error_logs_source_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX error_logs_source_idx ON public.error_logs USING btree (source);


--
-- Name: error_logs_timestamp_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX error_logs_timestamp_idx ON public.error_logs USING btree ("timestamp");


--
-- Name: messages_chat_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX messages_chat_idx ON public.messages USING btree (chat_id);


--
-- Name: messages_timestamp_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX messages_timestamp_idx ON public.messages USING btree ("timestamp");


--
-- Name: notifications_created_at_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX notifications_created_at_idx ON public.notifications USING btree (created_at);


--
-- Name: notifications_user_id_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX notifications_user_id_idx ON public.notifications USING btree (user_id);


--
-- Name: posts_created_at_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX posts_created_at_idx ON public.posts USING btree (created_at);


--
-- Name: posts_rate_limit_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX posts_rate_limit_idx ON public.posts USING btree (user_id, created_at);


--
-- Name: posts_user_id_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX posts_user_id_idx ON public.posts USING btree (user_id);


--
-- Name: requests_from_user_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX requests_from_user_idx ON public.connection_requests USING btree (from_user_id);


--
-- Name: requests_post_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX requests_post_idx ON public.connection_requests USING btree (post_id);


--
-- Name: requests_to_user_idx; Type: INDEX; Schema: public; Owner: findateammate_user
--

CREATE INDEX requests_to_user_idx ON public.connection_requests USING btree (to_user_id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON SEQUENCES TO findateammate_user;


--
-- Name: DEFAULT PRIVILEGES FOR TYPES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TYPES TO findateammate_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON FUNCTIONS TO findateammate_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO findateammate_user;


--
-- PostgreSQL database dump complete
--

\unrestrict 7WfEYsSsGhCYbLpynto8Hl2QRz5EIhe7cJf1pqjMVshuEx6KPOadVyTNXx5daIe

