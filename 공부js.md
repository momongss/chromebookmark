### 드래그 할 때 자식이 드래그 되지 않게 하고 싶을 때

- 약간 핵의 느낌이 있지만, z-index 로 자식을 부모의 뒤로 보내주면 된다. 부모가 투명할 때만 사용할 수 있는 방법이다.

### circular dependencies

    // A.js
    import B from './B.js'
    export default class A{}
    // B.js
    import A from './A.js'
    export default class B extends A{}

    >> 서로가 서로에 의존하고 있으면 상속될 수 없다.
    3개 이상의 class 의 경우에도 동일하다.
