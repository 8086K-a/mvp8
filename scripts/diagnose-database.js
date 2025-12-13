require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少Supabase配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseDatabase() {
  console.log('🔍 数据库诊断开始...\n')

  try {
    // 1. 检查触发器是否存在
    console.log('1️⃣ 检查触发器...')
    const { data: triggers, error: triggerError } = await supabase
      .rpc('get_triggers')
      .select('*')

    if (triggerError) {
      console.log('❌ 无法检查触发器:', triggerError.message)
    } else {
      console.log('✅ 触发器检查完成')
    }

    // 2. 检查函数是否存在
    console.log('\n2️⃣ 检查函数...')
    const { data: functions, error: functionError } = await supabase
      .rpc('get_functions')
      .select('*')

    if (functionError) {
      console.log('❌ 无法检查函数:', functionError.message)
    } else {
      console.log('✅ 函数检查完成')
    }

    // 3. 检查表结构
    console.log('\n3️⃣ 检查表结构...')
    
    // 检查profiles表
    const { data: profileColumns, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(0)

    if (profileError) {
      console.log('❌ profiles表结构问题:', profileError.message)
    } else {
      console.log('✅ profiles表结构正常')
    }

    // 检查user_settings表
    const { data: settingsColumns, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(0)

    if (settingsError) {
      console.log('❌ user_settings表结构问题:', settingsError.message)
    } else {
      console.log('✅ user_settings表结构正常')
    }

    // 检查subscriptions表
    const { data: subscriptionColumns, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(0)

    if (subscriptionError) {
      console.log('❌ subscriptions表结构问题:', subscriptionError.message)
    } else {
      console.log('✅ subscriptions表结构正常')
    }

    // 4. 尝试手动插入测试数据
    console.log('\n4️⃣ 测试手动插入...')
    
    // 创建一个测试用户ID
    const testUserId = '00000000-0000-0000-0000-000000000001'
    
    try {
      // 尝试插入profiles
      const { error: profileInsertError } = await supabase
        .from('profiles')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          full_name: 'Test User',
          custom_count: 0,
          is_pro: false
        })

      if (profileInsertError) {
        console.log('❌ profiles插入失败:', profileInsertError.message)
      } else {
        console.log('✅ profiles插入成功')
        
        // 清理测试数据
        await supabase
          .from('profiles')
          .delete()
          .eq('id', testUserId)
      }
    } catch (error) {
      console.log('❌ profiles插入异常:', error.message)
    }

    // 5. 检查RLS策略
    console.log('\n5️⃣ 检查RLS策略...')
    
    const { data: rlsPolicies, error: rlsError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    if (rlsError) {
      console.log('❌ RLS策略问题:', rlsError.message)
    } else {
      console.log('✅ RLS策略正常')
    }

    // 6. 检查auth.users表权限
    console.log('\n6️⃣ 检查auth.users表...')
    
    // 尝试查询auth.users表（这通常会被拒绝，但可以测试权限）
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1)

    if (authError) {
      console.log('ℹ️  auth.users表访问被拒绝 (正常):', authError.message)
    } else {
      console.log('✅ auth.users表可访问')
    }

  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message)
  }
}

// 运行诊断
diagnoseDatabase() 