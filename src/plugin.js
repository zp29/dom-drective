
let startX,
    startY,
    DirectiveNamesArr = [
      {name:'MoveUp', touch: true},
      {name:'MoveDown', touch: true},
      {name:'SlideUp', touch: true},
      {name:'SlideLeft', touch: true},
      {name:'SlideDown', touch: true},
      {name:'SlideRight', touch: true},
      {name:'Click', touch: true},
      {name:'TouchStart', touch: true},
      {name:'TouchMove', touch: true},
      {name:'TouchEnd', touch: true},
      {name:'DoubleTouch', touch: true},
      {name:'LongTouch', touch: true},
      {name:'DoubleClick', touch: true},
      {name:'Speed', touch: false},
      {name:'Loadedifcomplete', touch: false},
      {name:'PhotosBackColor', touch: true, scroll: true},
      {name:'observeHeight', touch: false},
      {name:'visible', touch: false},
      //监听元素高度变化，更新滚动容器
    ]

export default {
    install (Vue) {
      DirectiveNamesArr.forEach((item) => {
        let key = item.name,
            meedTouch = item.touch,
            meedScroll = item.scroll

        Vue.directive(key, {
            bind: function (el, binding, vnode) {
              el[key] = function (Directive, obj) {
                StartCall(Directive, binding.value, binding.name, obj)
              }
              const Callback = (Directive, obj)=>{
                if ( obj.e ){
                  el[Directive](Directive, Object.values(obj))
                } else {
                  el[Directive](Directive, obj)
                }
              }

              if ( key === 'visible' ) {
                el.style.visibility = !!binding.value ? '' : 'hidden'
              }

              if ( meedTouch || meedScroll ) {
                AddListen(el, Callback, key, binding, item)
              }
              if ( key === 'Speed' && hasClass(el, 'Speed') ) {
                Speed.bind(el, binding)
              }
              if ( key === 'Loadedifcomplete' && el.tagName === 'IMG' && el.complete) {
                Callback('Loadedifcomplete', el)
              }
              if ( key == 'observeHeight' ) {
                const MutationObserver = window.MutationObserver || window.webkitMutationObserver || window.MozMutationObserver
                let recordHeight = 0
                const onHeightChange = _.throttle(function () { // _.throttle 节流函数
                  let height = window.getComputedStyle(el).getPropertyValue('height');
                  if (height === recordHeight) {
                    return
                  }
                  recordHeight = height
                  Callback('observeHeight', el)
                }, 500)

                el.__onHeightChange__ = onHeightChange

                el.addEventListener('animationend', onHeightChange)

                el.addEventListener('transitionend', onHeightChange)

                el.__observer__ = new MutationObserver((mutations) => {
                  onHeightChange()
                });

                el.__observer__.observe(el, {
                  childList: true,
                  subtree: true,
                  characterData: true,
                  attributes: true
                })
              }
            },
            componentUpdated: function(el, binding) {
              if ( key == 'Speed' && hasClass(el, 'Speed') ) {
                Speed.componentUpdated(el, binding)
              }

              if ( key === 'visible' ) {
                el.style.visibility = !!binding.value ? '' : 'hidden'
              }

              el[key] = function (Directive, obj) {
                StartCall(Directive, binding.value, binding.name, obj)
              }
            },
            unbind: function (el) {
              RemoveListen(el)
              if (el.__observer__) {
                el.__observer__.disconnect()
                el.__observer__ = null
              }
              el.removeEventListener('animationend', el.__onHeightChange__)
              el.removeEventListener('transitionend', el.__onHeightChange__)
              el.__onHeightChange__ = null
            }
        })
      })
    }
}


const Speed = {
  bind : (el, binding) => {
    let numer = binding.value || binding.value.value || 0,
        color = binding.value.color || '#ffcc00',
        StyleStr = ''
    if (typeof numer === 'number' ) {
      StyleStr = `background-image: linear-gradient(to right,${color} ${numer}%, transparent 0);`
    } else if (typeof numer === 'string' ) {
      StyleStr = `background-image: linear-gradient(to right,${color} ${numer}, transparent 0);`
    }
    el.style.cssText = StyleStr
    addClass(el, 'v-speed')
  },
  componentUpdated : (el, binding) => {
    let numer = binding.value || binding.value.value || 0,
        color = binding.value.color || '#ffcc00',
        StyleStr = '',
        oldValue = binding.oldValue,
        speed = binding.speed || 2,
        speedNum = oldValue < numer ? speed : speed * -1

    cancelAnimationFrame(timer)
    let timer = requestAnimationFrame( function fn(){
      let positive = speedNum > 0 && oldValue < numer,
          negative = speedNum < 0 && oldValue > numer
      if ( positive || negative )
        oldValue += speedNum
      // else
        // oldValue = numer && cancelAnimationFrame(timer)

      if (typeof oldValue === 'number' )
        StyleStr = `background-image: linear-gradient(to right,${color} ${oldValue}%, transparent 0);`
      else if (typeof oldValue === 'string' )
        StyleStr = `background-image: linear-gradient(to right,${color} ${oldValue}, transparent 0);`
      el.style.cssText = StyleStr
      timer = requestAnimationFrame(fn)
    })
  }
}
const StartCall = (Directive, value, DirectiveName, obj) => {
  if ( !value ) { console.warn(`No Function or No Value ? undefined`); return }
  if ( Directive !== DirectiveName ) return

  let ShowDirectiveArr = ['SlideUp','SlideLeft','SlideDown','SlideRight'],
      afterOtion

  if ( Array.isArray(obj) ) {
    afterOtion = obj
  } else {
    afterOtion = [obj]
  }

  if ( typeof value == "function" ){
    ShowDirectiveArr.includes(Directive) ? value.call(this, Directive, ...afterOtion) : value.call(this, ...afterOtion)
  } else if ( typeof value == "object" && value.methods ){
    let tmpValue = _.cloneDeep(value)
    delete tmpValue.methods
    let option = Object.values(tmpValue)
    ShowDirectiveArr.includes(Directive) ? value.methods.call(this, ...option, Directive, ...afterOtion) : value.methods.call(this, ...option, ...afterOtion)
  }
}

const AddListen = (el, Callback, SlideDirection, binding, item)=>{
  if ( item.scroll ) {
    el.addEventListener("scroll", ScrollFun.bind({}, Callback, el, binding), false)
  }
  if ( el.EventList === undefined ) {
    el.EventList = []
    el.EventList.push(SlideDirection)
    if ( "ontouchend" in document ) {
      el.addEventListener("touchstart", TouchStart.bind({}, Callback, el, binding), false)
      el.addEventListener("touchmove",  TouchMove.bind( {}, Callback, el, binding), false)
      el.addEventListener("touchend",   TouchEnd.bind(  {}, Callback, el, binding), false)
    } else {
      el.addEventListener("click", Click.bind({}, Callback, el), false);
    }
  } else {
    el.EventList.push(SlideDirection)
  }
}

const RemoveListen = (el) => {
  el.removeEventListener("touchstart", TouchStart, {});
  el.removeEventListener("touchmove", TouchMove, {});
  el.removeEventListener("touchend", TouchEnd, {});
}

let ClickEl       = []
let TouchStart = (callback, el, binding, e) => {
  if ( !callback || !el ) return
  let SlideDirection = el.EventList,
      arr = ['MoveUp','MoveDown','SlideLeft','SlideRight','SlideUp','SlideDown','Click','TouchMove','PhotosBackColor'],
      DirectiveHas = SlideDirection.some(item => arr.includes(item))

  if( e.touches.length >= 2 && SlideDirection.includes('DoubleTouch') ) {
    el.DoubleTouch  = true
    el.StartTouches = e.touches
  } else {
    el.DoubleTouch  = false
  }

  el.DistanceMove = false
  el.SlideMove    = false
  startX = e.touches[0].pageX
  startY = e.touches[0].pageY

  if ( SlideDirection.includes('TouchStart') ) {
    callback('TouchStart', {e, el})
    if ( DirectiveHas ) {
      e.stopPropagation()
      // e.preventDefault()
    }
    return
  }

  if ( SlideDirection.includes('LongTouch') ) {
    clearTimeout(el.LongTouchTime)
    el.LongTouchTime = setTimeout(()=>{ callback('LongTouch', e) }, 666)
    console.log('preventDefault');
    e.preventDefault()
    return
  }

  if ( SlideDirection.includes('Click') ) {
    let parentList = event.path || (event.composedPath && event.composedPath())
    el.PressTimer = setTimeout(() => {
      for (let i = 0, len = parentList.length; i < len; i++) {
        if ( hasClass(parentList[i], 'Click-Press') ) {
          ClickEl.push(parentList[i])
          parentList[i].style.backgroundColor = "#eee"
          break;
        }
      }
    }, 150)
  }
}

let TouchMove = (callback, el, binding, e) => {
  if ( !callback || !el ) return

  el.SlideMove    = true
  clearTimeout(el.PressTimer)

  let SlideDirection = el.EventList
  let endX = e.changedTouches[0].pageX,
      endY = e.changedTouches[0].pageY,
      distanceY = endY - startY,
      distanceX = endX - startX

  clearTimeout(el.LongTouchTime)

  if ( SlideDirection.includes('Click') ) {
    for (let i = 0, len = ClickEl.length; i < len; i++) {
      ClickEl[i].style.backgroundColor = ""
    }
  }

  if( e.touches.length >= 2 || el.DoubleTouch ) {
    if ( SlideDirection.includes('DoubleTouch') ) {
      let MoveTouches = e.touches,
          scale       = getDistance(MoveTouches[0],MoveTouches[1])/getDistance(el.StartTouches[0],el.StartTouches[1]),
          rotation    = getAngle(MoveTouches[0],MoveTouches[1])-getAngle(el.StartTouches[0],el.StartTouches[1])
      callback('DoubleTouch', {scale, rotation, e})
    }
    console.log('preventDefault');
    e.preventDefault()
    e.stopPropagation()
    return
  }

  let arr = ['MoveUp','MoveDown','SlideLeft','SlideRight','SlideUp','SlideDown','Click','TouchMove','PhotosBackColor'],
      DirectiveHas = SlideDirection.some(item => arr.includes(item))
  if ( el.SlideMove && !DirectiveHas ) return
  let direction = GetSlideDirection(startX, startY, endX, endY)
  if ( SlideDirection.includes('PhotosBackColor') ) {
    let color = binding && binding.value,
        scrollTop = el.scrollTop
    if ( (direction == 1 || direction == 2 ) && scrollTop < 0 ) el.style.backgroundImage = `linear-gradient(${color} ${scrollTop * -1 + 2}px, #fff 0)`
    else el.style.backgroundImage = ``
  }
  if ( SlideDirection.includes('TouchMove') ) {
    // console.log('dom.js TouchMove ->', distanceX, distanceY);
    callback('TouchMove', {distanceX, distanceY, direction, e})
    e.stopPropagation()
    // e.preventDefault()
    return
  }

  const Move = () => {
    el.DistanceMove = true
    // if( !SlideDirection.includes('Click') ) 
    //    e.stopPropagation()
  }
  const NoMove = () => {
    el.DistanceMove = false
    // if( !SlideDirection.includes('Click') )
    //   e.stopPropagation()
  }

  switch (direction) {
    case 1:
      SlideDirection.includes('MoveUp') && el.DistanceMove ? callback('MoveUp', e) : ''
      Move()
      break;
    case 2:
      SlideDirection.includes('MoveDown') && el.DistanceMove ? callback('MoveDown', e) : ''
      Move()
      break;
    case 3:
      distanceX < -60 ? Move() : NoMove()
      if ( (SlideDirection.includes('SlideLeft') || SlideDirection.includes('SlideRight')) ) {
        console.log('preventDefault');
        e.preventDefault()
      }
      break;
    case 4:
      distanceX > 60 ? Move() : NoMove()
      if ( (SlideDirection.includes('SlideLeft') || SlideDirection.includes('SlideRight')) ) {
        console.log('preventDefault');
        e.preventDefault()
      }
      break;
    default:
      break;
  }
}

let ScrollFun = (callback, el, binding, e) => {
  let SlideDirection = el.EventList
  if ( SlideDirection.includes('PhotosBackColor') ) {
    let color = binding && binding.value,
        scrollTop = el.scrollTop
    if ( scrollTop < 0 ) el.style.backgroundImage = `linear-gradient(${color} ${scrollTop * -1 + 2}px, #fff 0)`
    else el.style.backgroundImage = ``
  }
}

let TouchEnd = (callback, el, binding, e) => {
  if ( !callback || !el ) return
  let SlideDirection = el.EventList
  let endX = e.changedTouches[0].pageX,
      endY = e.changedTouches[0].pageY,
      direction = GetSlideDirection(startX, startY, endX, endY),
      positionX = el.clientWidth  / 2 > endX ? 3 : 4,
      positionY = el.clientHeight / 2 > endY ? 1 : 2,
      distanceY = endY - startY,
      distanceX = endX - startX

  if ( SlideDirection.includes('PhotosBackColor') ) {
    let color = binding && binding.value,
        scrollTop = el.scrollTop
    if ( scrollTop < 0 ) el.style.backgroundImage = `linear-gradient(${color} ${scrollTop * -1 + 2}px, #fff 0)`
    clearTimeout(el.PhotosBackColorTimer)
    el.PhotosBackColorTimer = setTimeout(() => {
      el.style.backgroundImage = ''
    }, 456)
  }

  clearTimeout(el.PressTimer)

  for (let i = 0, len = ClickEl.length; i < len; i++) {
    ClickEl[i].style.backgroundColor = ""
  }
  ClickEl = []

  if( el.DoubleTouch || SlideDirection.includes('DoubleTouch') ){
    callback('DoubleTouch', {bool:false, e})
    return
  }

  if ( SlideDirection.includes('TouchEnd') ) {
    callback('TouchEnd', {e})
    return
  }

  clearTimeout(el.LongTouchTime)

  if ( SlideDirection.includes('DoubleClick') && SlideDirection.includes('Click') && !el.DoubleTouch ) {
    let nowTime = new Date().getTime()
    if ( nowTime - el.lastClickTime < 400 ) {
      callback('DoubleClick', e)
      el.lastClickTime = 0
    } else {
      el.lastClickTime = nowTime;
      if ( !el.SlideMove && !el.DoubleTouch) {
        if ( e.target && hasClass(e.target, 'InputDefault') ) {
          console.log('preventDefault');
          e.preventDefault()
          e.stopPropagation()
        }
        callback('Click', {e, positionX, positionY})
      }
    }
  } else {
    if ( SlideDirection.includes('Click') && !el.SlideMove && !el.DoubleTouch ) {
      if ( e.target && hasClass(e.target, 'InputDefault') ) {
        console.log('preventDefault');
        e.preventDefault()
        e.stopPropagation()
      }
      callback('Click', {e, positionX, positionY})
    }
  }

  switch (direction) {
    case 1:
      SlideDirection.includes('SlideUp') && el.DistanceMove ? callback('SlideUp', e) : ''
      break;
    case 2:
      SlideDirection.includes('SlideDown') && el.DistanceMove ? callback('SlideDown', e) : ''
      break;
    case 3:
      SlideDirection.includes('SlideLeft') && el.DistanceMove ? callback('SlideLeft', e) : ''
      break;
    case 4:
      SlideDirection.includes('SlideRight') && el.DistanceMove ? callback('SlideRight', e) : ''
      break;
    default:
      break;
  }
}

function Click (callback, el, e) {
  let SlideDirection = el.EventList,
    endX = e.pageX,
    endY = e.pageY,
    positionX = el.clientWidth  / 2 > endX ? 3 : 4,
    positionY = el.clientHeight / 2 > endY ? 1 : 2;

  if ( SlideDirection.includes("Click") ) {
    callback('Click', {e, positionX, positionY});
  }
};

const getDistance = (p1, p2) => {
    var x = p2.pageX - p1.pageX,
        y = p2.pageY - p1.pageY;
    return Math.sqrt((x * x) + (y * y));
}

const getAngle = (p1, p2) => {
    var x = p1.pageX - p2.pageX,
        y = p1.pageY- p2.pageY;
    return Math.atan2(y, x) * 180 / Math.PI;
}

const GetSlideDirection = (startX, startY, endX, endY) => {
  let dy = startY - endY,
      dx = endX - startX,
      result = 0
  if (Math.abs(dx) < 2 && Math.abs(dy) < 2) {
    return result;
  }
  var angle = Math.atan2(dy, dx) * 180 / Math.PI;
  if (angle >= -45 && angle < 45) {
    result = 4;
  } else if (angle >= 45 && angle < 135) {
    result = 1;
  } else if (angle >= -135 && angle < -45) {
    result = 2;
  } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
    result = 3;
  }
  return result;
}

function hasClass(el, className) {
  let reg = new RegExp('(^|\\s)' + className + '(\\s|$)')

  return reg.test(el.className);
}

function addClass(el, className) {
  if (hasClass(el, className)) {
    return
  }

  let newClass = el.className.split(' ')
  newClass.push(className)
  el.className = newClass.join(' ')
}

function removeClass(el, className) {
  if (!hasClass(el, className)) {
    return
  }

  let reg = new RegExp('(^|\\s)' + className + '(\\s|$)', 'g')
  el.className = el.className.replace(reg, '')
}

/**
 * 切换 Active -> BuzzFilter 模块
 * @param {Object}  els   元素集
 * @param {Boolean} clear 是否为单选
 */
function ChangItemActive(els, clear = false) {
  for(let item of els){
    item.onclick = function () {
      clear ? clearItemActive(els, 'active') : ''
      hasClass(this, 'active') ? removeClass(this, 'active') : addClass(this, 'active')
    }
  }
}

/**
 * 清除 Active 样式 -> 用于 Active 只能单选
 * @param  {objct} els       元素集合
 * @param  {String} className 名
 */
function clearItemActive(els, className) {
  for(let item of els){
    removeClass(item, className)
  }
}