# The Oracle and The Below

## Project overview

**The Oracle and The Below** is an asynchronous educational game for college students about the human labor behind artificial intelligence. Students become workers in a fictional kingdom, contributing observations, corrections, and judgments to an apparently all-knowing Oracle. As the Oracle grows more magnificent, a running ledger reveals how much value their work generates—and how little of that value reaches them.

The project uses fantasy, visual observation, and institutional satire to introduce questions about labor, compensation, cultural judgment, and power. Students play individually at their own pace while contributing to shared class totals.

## Educational purpose

The game invites students to consider:

- How human observation and interpretation contribute to AI systems.
- Who defines quality, decides whether work is accepted, and controls payment.
- How subjective judgments can become labels presented as authoritative knowledge.
- What happens when workers cannot see or challenge the standards used to reject their work.
- How workers might respond through negotiation, continued work, or collective appeals.
- The value of their own contribution to building the Oracle.

The activity is inspired by Rebecca Tan and Regine Cabato’s article, “Behind the AI boom, an army of overseas workers in ‘digital sweatshops,’” published in *The Washington Post* on August 28, 2023. Its characters, currency, payment amounts, and outcomes are fictional. It explores themes from the assigned reading rather than recreating a particular worker’s experience. The article is supplied separately through course materials.

## The student experience

Students complete nine assignments and a short final reflection. There is no timer. The activity is designed for approximately 10–15 minutes, with additional time available for writing and discussion.

| Assignment | Student contribution |
| --- | --- |
| 1. Describe the circled subject | Describe a goose in a photograph, identifying visible details and distinguishing observation from inference. |
| 2. Verify a label | Correct the Oracle’s claim that a locomotive is “a car,” using evidence from the photograph. |
| 3. Identify a circle | Select A, B, or C from three shapes. |
| 4. Judge Renaissance paintings | Answer Yes, No, or Unsure for three paintings and explain those judgments. |
| 5. Judge scenes of flowers in bloom | Evaluate three flower photographs and write a separate explanation focused on scenery. |
| 6. Judge abstract sculptures | Evaluate three sculptures and explain those judgments. |
| 7. Choose a response | Ask for clear rules and payment, keep working under existing terms, or join other workers in requesting an outside review. |
| 8. Repair a caption | Replace a vague description of flowers with a more useful caption. |
| 9. Describe without ranking | Describe a sculpture’s visible characteristics under an explicit standard. |

The final reflection asks, **“What is the value of your work?”** Students write two to four sentences about their contribution to building the Oracle. Completion is recorded; writing quality and fictional earnings are not automatically graded.

### Instructor note: the hidden standards

The three beauty assignments reject the work regardless of the student’s selections. The client cites undisclosed standards and a non-disclosure agreement. This mechanism is intentional: it creates an experience for later discussion about subjective standards and control over compensation. The rejection screen does not explain away the experience as it happens.

The final choice changes the payment conditions for the last two assignments. Negotiation produces full payment for accepted future work. Continuing under existing terms preserves reduced payments. An outside review remains pending. These are fictional scenarios for discussion, not predictions about real labor disputes.

## MAX, the virtual advocate

An optional **“Need assistance? Ask MAX, your virtual advocate!”** control is available throughout the exercise. MAX is a fictional 80-year-old advocate who can be useful, distracted, evasive, or cranky about bureaucracy. His irritation is directed toward the system rather than the student.

In connected class play, MAX can respond through OpenRouter using free-model routing. Each student has up to three exchanges per class. If AI is unavailable, the game provides labeled authored replies. Practice uses authored replies only.

MAX cannot change payments, award grades, or file real complaints. Opening the conversation preserves unfinished assignment writing and image selections. Consent to send messages to OpenRouter is remembered for that student and class in the same browser and can be withdrawn before another message.

## Visual design

The interface contrasts a grand Oracle above with the worker’s paper-like workstation below. Deep green and blue backgrounds, warm gold details, and restrained typography establish a fanciful institutional setting.

Four illustrated Oracle stages—Dormant, Awakening, Prosperous, and Magnificent—change as the individual completes assignments. Gentle crossfades convey growth without elaborate animation and respect reduced-motion preferences. Actual photographs and artwork reproductions form the assignments, with alternative text, full-size viewing links, and source and license credits.

## Participation and class records

Students enter a private two-word access code plus four digits. No student name or email is collected. The instructor keeps the name-to-worker-ID roster separately. Their responses, progress, reflection, and completion are saved for the instructor. A class display aggregates contributions, Oracle revenue, worker payments, and completions; classmates do not see one another’s identifiable responses.

The instructor can review participation, written work, optional conversations, and reflections, and export a gradebook CSV. Completing nine assignments and the reflection establishes the completion record. The instructor determines the final grade. The game does not automatically post grades to a learning management system.

Practice mode requires no account, saves progress on the current browser, and does not create a course participation record.

## Implementation and current status

The project uses a lightweight JavaScript website built with Vite, Supabase for instructor authentication and saved class records, private code sessions for students, and a protected Supabase function for the optional OpenRouter conversation. Ordinary assignments and reflections are not automatically sent to an AI provider. API secrets remain on the server.

As of September 16, 2026:

- The revised visual edition is implemented and has been reviewed by the project owner in the local preview.
- The nine-assignment practice journey and reflection have been checked in the browser.
- Sixteen automated tests pass, covering accounting, submissions, access restrictions, completion, and AI behavior.
- The revised database functions, private-code service, and MAX service are deployed to the connected Supabase project. Sixty private codes are prepared; live code sign-in, resume, and sign-out have been verified.
- Existing saved class records are preserved. Unfinished records from an older edition cannot mix with the new assignment sequence.
- Oracle has its own Vercel project, connected to this repository. The main website links to and routes the game at `https://mleungphd.org/oracle/`; see [HOSTING.md](HOSTING.md).
- Before classroom rollout, the final instructor email sign-in address must be configured. Student code sign-in requires no email delivery.

## Related files

- [ACCESS-CODES.md](ACCESS-CODES.md): private student sign-in, distribution, and code replacement.
- [README.md](README.md): operation, classroom setup, and teaching notes.
- [AI-SETUP.md](AI-SETUP.md): MAX integration, privacy controls, and usage limits.
- [ARTWORK.md](ARTWORK.md): Oracle illustration provenance.
- [Image credits](public/assignments/CREDITS.md): assignment image sources and reuse terms.
