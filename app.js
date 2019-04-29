$(document).ready(function () {
  const TODO_CLASS_DONE = 'todo-done'
  const CHECK_TS = 3000

  // used to check our todo data vs the todo data on server
  var tsLastSaved

  // set the titles for each day
  $('.day-container').each(function (index, obj) {
    $(obj).find('h2').html($(obj).attr('name'))
  })

  // load todos
  load()

  // check for list change every so often
  setTimeout(checkReload, CHECK_TS)

  /**
   * Clear all todos with double tap of header
   */
  $('h1').swipe({
    tap: function () {},
    doubleTap: function (event, target) {
      if (confirm('Delete all items and Start Over?')) {
        $('ul').empty()
        save()
      }
    }
  })

  /**
   * add a new todo when a day container is clicked
   */
  $('.day-container').on('click', function (eventInfo) {
    // get new todo text from user with prompt
    var name = $(this).attr('name')
    var todoText = prompt('Enter Todo Item For ' + name)

    // the prompt dialog returns 'null' if user pressed cancel
    // of a string if user pressed ok
    if (todoText) {
      if (todoText !== '') {
        var todoItem = createTodoItem($(this), todoText)
        registerTodoItemEvents(todoItem)
        save()
      }
    }
  })

  /**
   * Adds gesture and event listeners to a todo item. These events will modify the state of a todo item.
   * @param {Element} todo
   */
  function registerTodoItemEvents (todo) {
    // catch click for this item (edit) and prevent it from progatating to container
    $(todo).on('click', function () {
      event.stopPropagation()
    })

    // todo item actions
    $(todo).swipe({
      // mark item as completed / delete item
      swipeRight: function (event, direction, distance, duration, fingerCount, fingerData) {
        // check for 2nd swipe - if so, ask if todo item is to be delete
        if ($(todo).hasClass(TODO_CLASS_DONE)) {
          if (confirm('Delete todo?')) {
            deleteTodoItem(todo)
            save()
          }
        } else {
          // mark item as completed
          $(todo).addClass(TODO_CLASS_DONE)
          save()
        }
      },
      // remove "completed" status
      swipeLeft: function (event, direction, distance, duration, fingerCount, fingerData) {
        if ($(todo).hasClass(TODO_CLASS_DONE)) {
          $(todo).removeClass(TODO_CLASS_DONE)
          save()
        }
      },

      // modify the text of a todo item
      tap: function () {},
      doubleTap: function (event, target) {
        // if item is completed, don't bother with text change request
        if ($(todo).hasClass(TODO_CLASS_DONE)) {
          return
        }
        var newText = prompt('Change Todo', $(todo).html())
        if (newText) {
          if (newText !== '') {
            $(todo).html(newText)
            save()
          }
        }
      },
      // how far should user swipe to detect gesture?
      // Default is 75px, set to 0 for demo so any distance triggers swipe
      threshold: 75
    })
  }

  /**
   * Creates a Todo Item and returns element
   * @param {Element} dayContainer
   * @param {string} todoText
   * @param {string} done
   */
  function createTodoItem (dayContainer, todoText, id, classes) {
    var listContainer = $(dayContainer).find('ul')
    var id = id || ID()
    var newTodo = $('<li id="' + id + '" class="' + classes + '">' + todoText + '</li>')
    listContainer.append(newTodo)
    return newTodo
  }

  /**
   * Deletes Element Item
   * @param {Element} todo
   */
  function deleteTodoItem (todo) {
    $(todo).remove()
  }

  function save () {
    var days = {}
    $('.day-container').each(function (index, day) {
      var dayName = $(day).attr('name')
      days[dayName] = {}

      $(day).find('li').each(function (index, todo) {
        var todoID = $(todo).attr('id')
        days[dayName][todoID] = {}
        days[dayName][todoID].id = todoID || ''
        days[dayName][todoID].text = $(todo).html() || ''
        days[dayName][todoID].class = $(todo).attr('class') || ''
      })
    })

    $.ajax({
      type: 'POST',
      url: 'todo-post.php',
      data: JSON.stringify(days),
      success: function () {
        updateTimestamp()
      }
    })
  }

  function load () {
    // get todo objects
    $.ajax({ type: 'GET',
      url: 'todo-get.php',
      success: function (data) {
        var days = JSON.parse(data)
        for (var keyDays in days) {
          var day = days[keyDays]
          $("[name='" + keyDays + "']").find('ul').empty()
          for (var todoKey in day) {
            var todo = day[todoKey]
            registerTodoItemEvents(createTodoItem($("[name='" + keyDays + "']"), todo.text, todo.id, todo.class))
          }
        }
        updateTimestamp()
      }
    })
  }

  function updateTimestamp () {
    // get timestamp of file changed
    $.ajax({ type: 'GET',
      url: 'todo-ts.php',
      success: function (data) {
        tsLastSaved = data
      }
    })
  }

  function checkReload () {
    // get timestamp of file changed
    $.ajax({ type: 'GET',
      url: 'todo-ts.php',
      success: function (data) {
        console.log(tsLastSaved + ', ' + data)
        if (tsLastSaved !== data) {
          load()
        }
      }
    })
    setTimeout(checkReload, CHECK_TS)
  }

  /**
   * Generate unique ID
   */
  function ID () {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9)
  };
})
