const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'moviesData.db')
let db = null
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is running at http://localhost:3000/')
    })
  } catch (e) {
    console.log('DB Error: ${e.message}')
    process.exit(1)
  }
}
initializeDBAndServer()

//Get the movie names API 1

app.get('/movies/', async (request, response) => {
  const getMovieQuery = `
    SELECT 
      * 
    FROM 
      movie
    ORDER BY movie_id;`
  const moviesArray = await db.all(getMovieQuery)
  response.send(
    moviesArray.map(eachMovie => ({movieName: eachMovie.movie_name})),
  )
})

//Create a new movie (POST) API 2

app.post(`/movies/`, async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const addMovieQuery = `
    INSERT INTO 
      movie(director_id,movie_name,lead_actor)
    VALUES 
    (
      ${directorId},
      '${movieName}',
      '${leadActor}');`
  const dbResponse = await db.run(addMovieQuery)
  response.send('Movie Successfully Added')
})

//Get the movie Id API 3

app.get(`/movies/:movieId/`, async (request, response) => {
  const {movieId} = request.params

  const getMovieQuery = `
  SELECT * FROM movie WHERE movie_id =${movieId}`
  const movieDetails = await db.get(getMovieQuery)

  const {movie_id, director_id, movie_name, lead_actor} = movieDetails
  const dbResponse = {
    movieId: movie_id,
    directorId: director_id,
    movieName: movie_name,
    leadActor: lead_actor,
  }
  response.send(dbResponse)
})
//Update the movie details (PUT) API 4

app.put(`/movies/:movieId/`, async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body

  const {directorId, movieName, leadActor} = movieDetails
  const updateMovieQuery = `
  UPDATE 
    movie
  SET 
    director_id = ${directorId},
    movie_name ='${movieName}',
    lead_actor = '${leadActor}'
  WHERE 
    movie_id = ${movieId}`
  await db.run(updateMovieQuery)
  response.send('Movie Details Updated')
})
//Delete a movie API 5

app.delete(`/movies/:movieId/`, async (request, response) => {
  const {movieId} = request.params

  const deleteMovieQuery = `
  DELETE from movie
  WHERE movie_id = ${movieId};`

  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})
//Get the list of all directors API 6

app.get(`/directors/`, async (request, response) => {
  const getDirectorsQuery = `
  SELECT * FROM director`

  const directorsList = await db.all(getDirectorsQuery)
  const ans = directorsList => {
    return {
      directorId: directorsList.director_id,
      directorName: directorsList.director_name,
    }
  }
  response.send(directorsList.map(eachDirector => ans(eachDirector)))
})

//Get the list of all movie names API 7

app.get(`/directors/:directorId/movies/`, async (request, response) => {
  const {directorId} = request.params
  const getDirectorIdQuery = `
    SELECT 
      director_id 
    FROM 
      movie
    WHERE director_id = ${directorId};`
  const getDirectorIdQueryResponse = await db.get(getDirectorIdQuery)
  const getMovieNameQuery = `
  SELECT movie_name AS moviName FROM movie
  WHERE movie_id = ${getDirectorIdQueryResponse.movie_id}`
  const getMovieNameQueryResponse = await db.get(getMovieNameQuery)
  response.send(getMovieNameQueryResponse)
})
module.exports = app
