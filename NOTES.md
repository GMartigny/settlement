# Side notes

The whole purpose of this project was to learn.

I could have go the easy path and use a framework or other external libraries.
But instead, I choose to everything on my own and try to learn as much as possible along the way.

I don't expect anyone to reads this, but I could myself come back to it some day.

## Stating point

The initial idea come from an inspiration after playing [A Dark Room](http://adarkroom.doublespeakgames.com/) and watching the [Extra Credits video on unfolding games](https://www.youtube.com/watch?v=ptk93AyICH0).
I wanted to try to create a similar game where player have to assign task to people.

At first, simply called "Unfold" [26/04/2016], I lay the first bits of code.
Peoples in a camp gathering resources to survives.
I pictured it as a crossover between [A Dark Room](http://adarkroom.doublespeakgames.com/) and [Die2Nite](http://www.die2nite.com) with the aesthetic of [Maze Runner 2](http://www.imdb.com/title/tt4046784/mediaviewer/rm2226648064).
Actions could unlock others and gameplay could evolve over time.

This first draft stay dormant for some time since I hit technicals limitations (AKA I didn't know enough).

I picked it up again with more knowledge [08/07/2016] and really start to do it as a main personal project.


## What I've done

From the beginning, the objective is to not use any code from outside for running the game (development tools can be used).

As of today, here what have been done (no specific order) :
  * Pseudo game-engine with managers (data, timer, graphics, message and save)
  * JS class for each game object with all the game logic
  * Some grunt tasks
    * Concat and uglify all JS and CSS
    * Concat all images
    * Check for linting in JS and CSS
    * Bump version number and publish game online
    * Run unit tests
  * Lots of utility functions
  * Pixel-art assets for resources and buildings

Plus a tool to place graphical assets with each others.


## What could be done

Here's some ideas that I scrap to limit scope (and keep my sanity) :
  * Adaptive difficulty
  * I18n
  * Display water and food level
  * Ambient sound/musics
  * Display villager doing their tasks
  * Graphical effect for ongoing events
  * Social (trade between camp, huge objective share by all players ...)
  * Achievements


## What I should have done

Doing everything on my own was an amazing experience and I've learn a lot.
I'm sure this will be useful in the future in term of knowledge and code-base.

But, in the end, it would have been good to learn a new framework and I could have finish this way earlier (pixi.js, vue.js ...).

Also, I love to develop tools but, unit tests for example have catch very few bugs and took quite some time to set up.

## Rant

There's no tools to build JS source (like uglify) but that follow dependencies.
I tried requireJS, but it rely on modular JS that didn't fit into client-side. (to try: browserify)

Anyway, those tools seams a bit overpowered just to concat and uglify sources.
Maybe, some day, I'll do a grunt task to order files input to uglify.
