# 2026_CursorHackathon

## Project Scope

## Features

P0:
A) Signal Input Layer: Fakes heart rate with a python app + manual im overwhelmed button + shows the heart rate + current heart rate + Focus Strain score based on app swithing, idle time, + long session time
B) Detect the heart rate and the decesion when certain is criteria is met
C) intervention pop up, encourage a walk breathe clairfy etc
E) Refocus mode: Ask user what they are working and what they need done on and suggest a way re-engage focus

P1:
A) Desktop activity + browerser activity +idle vs active + session duration
B) When session completed show stats of the work session
C) Demo: Normal, Stress, Overload

## Screens

Home

- Current HR
- Overwhelmed Status (lets not call it that)
- session + start stop

Focus Mode (session state screen)

- minimal + timer
- manual intervention avaialbe

Intervention Screen (Session state screen)

- Help decompress
- provide suggestion to break + encourage a reflection
- provide guidance to begin tasks when ready
- re-initialize next timer.

Session Summary Screen (Session State complete screen)

- Breakdown of session

Journal

- Enteries of journals + logs
- record of heart rate
- history of cognitive overload

## Python HR Server

- Create a Python server that directly sends a payload to the electron app
  - Will be sending through json ds
