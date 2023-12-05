namespace SpriteKind {
    export const treasure = SpriteKind.create()
    export const hitbox = SpriteKind.create()
    export const enemy_projectile = SpriteKind.create()
}

//  variables
let ship_acceleration = 1.5
let turn_speed = 0.2
let speed = 0
let rotation = 0
//  sprites 
let ship = sprites.create(assets.image`ship`, SpriteKind.Player)
transformSprites.rotateSprite(ship, 90)
//  setup
tiles.setCurrentTilemap(assets.tilemap`test`)
scene.cameraFollowSprite(ship)
function spawn_treasure() {
    let treasure: Sprite;
    let hitbox: Sprite;
    let tile: tiles.Location;
    if (sprites.allOfKind(SpriteKind.treasure).length < 10) {
        treasure = sprites.create(assets.image`x`, SpriteKind.treasure)
        hitbox = sprites.create(image.create(47, 47), SpriteKind.hitbox)
        spriteutils.drawCircle(hitbox.image, 24, 24, 20, 1)
        hitbox.setFlag(SpriteFlag.Invisible, true)
        tile = tilesAdvanced.getAllWallTiles()._pickRandom()
        tiles.placeOnTile(treasure, tile)
        tiles.placeOnTile(hitbox, tile)
        sprites.setDataSprite(hitbox, "treasure", treasure)
    }
    
}

game.onUpdateInterval(2000, spawn_treasure)
sprites.onOverlap(SpriteKind.Player, SpriteKind.hitbox, function collect_treasure(ship: Sprite, treasure_hitbox: Sprite) {
    info.changeScoreBy(randint(500, 2000))
    sprites.readDataSprite(treasure_hitbox, "treasure").destroy()
    treasure_hitbox.destroy()
    spawn_treasure()
})
function fire(source: Sprite, spritekind: number) {
    let proj: Sprite;
    let angle: number;
    for (let rotation = 0; rotation < 181; rotation += 180) {
        proj = sprites.create(assets.image`cannon ball`, spritekind)
        proj.setPosition(source.x, source.y)
        proj.setFlag(SpriteFlag.DestroyOnWall, true)
        angle = transformSprites.getRotation(source) + rotation
        angle = spriteutils.degreesToRadians(angle)
        spriteutils.setVelocityAtAngle(proj, angle, 100)
    }
}

controller.A.onEvent(ControllerButtonEvent.Pressed, function player_fire() {
    fire(ship, SpriteKind.Projectile)
})
function spawn_enemies() {
    let enemy: tilesAdvanced.PathfinderSprite;
    if (sprites.allOfKind(SpriteKind.Enemy).length < 10) {
        enemy = tilesAdvanced.createPathfinderSprite(assets.image`enemy`, SpriteKind.Enemy)
        tilesAdvanced.placeOnRandomTileOffScreen(enemy, assets.tile`water`)
        tilesAdvanced.followUsingPathfinding(enemy, ship, 20)
    }
    
}

//  game.on_update_interval(2000, spawn_enemies)
spawn_enemies()
function enemy_behaviour(enemy: any) {
    let angle_in_rads = spriteutils.angleFrom(enemy, ship)
    let angle_in_degrees = spriteutils.radiansToDegrees(angle_in_rads)
    if (spriteutils.distanceBetween(enemy, ship) > 80) {
        transformSprites.rotateSprite(enemy, angle_in_degrees + 90)
    } else {
        tilesAdvanced.stopFollowingPath(enemy)
        if (transformSprites.getRotation(enemy) - angle_in_degrees > 1) {
            transformSprites.changeRotation(enemy, -0.5)
        }
        
        if (randint(1, 100) == 1) {
            fire(enemy, SpriteKind.enemy_projectile)
        }
        
    }
    
}

sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Enemy, function destroy_enemy(cannon_ball: Sprite, enemy: Sprite) {
    cannon_ball.destroy()
    enemy.destroy()
})
sprites.onOverlap(SpriteKind.Player, SpriteKind.enemy_projectile, function hit() {
    info.changeLifeBy(-1)
    pause(1000)
})
function turn_ship() {
    
    if (controller.left.isPressed()) {
        rotation -= turn_speed
    } else if (controller.right.isPressed()) {
        rotation += turn_speed
    }
    
    rotation *= 0.7
    transformSprites.changeRotation(ship, rotation * speed / 10)
}

function move() {
    
    if (controller.up.isPressed()) {
        speed += ship_acceleration
    } else if (controller.down.isPressed()) {
        speed -= ship_acceleration
    }
    
    speed *= 0.98
    let angle = spriteutils.degreesToRadians(transformSprites.getRotation(ship) - 90)
    spriteutils.setVelocityAtAngle(ship, angle, speed)
}

game.onUpdate(function tick() {
    turn_ship()
    move()
    for (let enemy of sprites.allOfKind(SpriteKind.Enemy)) {
        enemy_behaviour(enemy)
    }
    info.changeScoreBy(1)
})
